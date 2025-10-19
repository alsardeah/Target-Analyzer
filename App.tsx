import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOpenCv } from './hooks/useOpenCv';
import type { Circle, Point, Mode, ToastMessage, GroupMetrics } from './types';
import { ControlPanel } from './components/ControlPanel';
import { CanvasComponent } from './components/CanvasComponent';
import { ResultsPanel } from './components/ResultsPanel';
import { Toast } from './components/Toast';
import { LoaderIcon, TargetIcon } from './components/icons';

const App: React.FC = () => {
    const { openCvReady } = useOpenCv();
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [detectedCircles, setDetectedCircles] = useState<Circle[]>([]);
    const [manualCircles, setManualCircles] = useState<Circle[]>([]);
    const [bulletDiameterMM, setBulletDiameterMM] = useState<number>(5.56);
    const [scale, setScale] = useState<number | null>(null); // pixels per mm
    const [mode, setMode] = useState<Mode>('edit');
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [distance, setDistance] = useState<number | null>(null);
    const [groupMetrics, setGroupMetrics] = useState<GroupMetrics | null>(null);
    const [toast, setToast] = useState<ToastMessage | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [houghParams, setHoughParams] = useState({
        sensitivity: 20,
        minRadius: 5,
        maxRadius: 25,
    });

    const allCircles = [...detectedCircles, ...manualCircles];

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const resetState = (keepImage: boolean = false) => {
        if (!keepImage) {
            setImage(null);
            imageRef.current = null;
        }
        setDetectedCircles([]);
        setManualCircles([]);
        setScale(null);
        setSelectedIndices([]);
        setDistance(null);
        setGroupMetrics(null);
    };

    const handleImageUpload = (file: File) => {
        if (file) {
            resetState();
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    setImage(img);
                    imageRef.current = img;
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };
    
    const detectCircles = useCallback(() => {
        if (!openCvReady || !image) return;
        
        setIsProcessing(true);
        // Clear previous detections but keep manual points
        setDetectedCircles([]);
        setSelectedIndices([]);

        setTimeout(() => { // Allow UI to update before heavy processing
            try {
                const cv = window.cv;
                const src = cv.imread(image);
                const gray = new cv.Mat();
                cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
                cv.GaussianBlur(gray, gray, new cv.Size(9, 9), 2, 2);

                const circles = new cv.Mat();
                // Parameters: (image, circles, method, dp, minDist, param1, param2, minRadius, maxRadius)
                cv.HoughCircles(gray, circles, cv.HOUGH_GRADIENT, 1, 15, 100, houghParams.sensitivity, houghParams.minRadius, houghParams.maxRadius);
                
                const detected: Circle[] = [];
                if (circles.cols > 0) {
                    for (let i = 0; i < circles.cols; ++i) {
                        const x = circles.data32F[i * 3];
                        const y = circles.data32F[i * 3 + 1];
                        const radius = circles.data32F[i * 3 + 2];
                        detected.push({ x, y, radius });
                    }
                }
                setDetectedCircles(detected);
                showToast(`Detected ${detected.length} potential holes.`, 'success');
                src.delete();
                gray.delete();
                circles.delete();
            } catch (error) {
                console.error("OpenCV Error: ", error);
                showToast('Failed to process image.', 'error');
            } finally {
                setIsProcessing(false);
            }
        }, 50);
    }, [image, openCvReady, houghParams]);

    useEffect(() => {
        if (image) {
            detectCircles();
        }
    }, [image]); // Removed detectCircles from dependency array to prevent re-running on param change
    
    useEffect(() => {
        // Per user request, use a fixed scale value instead of calculating it.
        if (image) {
            setScale(4.3165467625899280575539568345324);
        } else {
            setScale(null);
        }
    }, [image]);


    const calculateMetrics = useCallback(() => {
        const selectedCircles = selectedIndices.map(i => allCircles[i]);

        // --- Distance Calculation ---
        // Only modify distance state if in distance mode
        if (mode === 'distance') {
            if (selectedCircles.length === 2 && scale) {
                const [c1, c2] = selectedCircles;
                const dx = (c1.x - c2.x) / scale;
                const dy = (c1.y - c2.y) / scale;
                const dist = Math.sqrt(dx * dx + dy * dy);
                setDistance(dist);
            } else {
                setDistance(null); // Clear distance if selection is not 2 points in distance mode
            }
        }

        // --- Group Analysis Calculation ---
        // Only modify group metrics state if in stddev or edit mode
        if (mode === 'stddev' || mode === 'edit') {
            const circlesToAnalyze = (mode === 'stddev') ? selectedCircles : allCircles;
            if (circlesToAnalyze.length > 1 && scale) {
                const n = circlesToAnalyze.length;
                
                const meanX = circlesToAnalyze.reduce((sum, c) => sum + c.x, 0) / n;
                const meanY = circlesToAnalyze.reduce((sum, c) => sum + c.y, 0) / n;

                const varianceX = circlesToAnalyze.reduce((sum, c) => sum + Math.pow(c.x - meanX, 2), 0) / n;
                const varianceY = circlesToAnalyze.reduce((sum, c) => sum + Math.pow(c.y - meanY, 2), 0) / n;
                const stdDev = {
                    x: Math.sqrt(varianceX) / scale,
                    y: Math.sqrt(varianceY) / scale,
                };

                const distancesFromMean = circlesToAnalyze.map(c => Math.sqrt(Math.pow(c.x - meanX, 2) + Math.pow(c.y - meanY, 2)));
                const meanRadius = distancesFromMean.reduce((sum, d) => sum + d, 0) / n / scale;
                
                let maxDistSq = 0;
                for (let i = 0; i < n; i++) {
                    for (let j = i + 1; j < n; j++) {
                        const distSq = Math.pow(circlesToAnalyze[i].x - circlesToAnalyze[j].x, 2) + Math.pow(circlesToAnalyze[i].y - circlesToAnalyze[j].y, 2);
                        if (distSq > maxDistSq) {
                            maxDistSq = distSq;
                        }
                    }
                }
                const extremeSpread = Math.sqrt(maxDistSq) / scale;
                
                setGroupMetrics({ stdDev, meanRadius, extremeSpread });
            } else {
                setGroupMetrics(null); // Clear metrics if not enough points in the relevant modes
            }
        }
    }, [selectedIndices, allCircles, mode, scale]);
    
    useEffect(() => {
        calculateMetrics();
    }, [selectedIndices, allCircles, mode, scale, calculateMetrics]);


    const handleCanvasClick = (point: Point) => {
        const clickedCircleIndex = allCircles.findIndex(c => Math.sqrt(Math.pow(c.x - point.x, 2) + Math.pow(c.y - point.y, 2)) < c.radius + 5);

        if (mode === 'edit') {
            if (clickedCircleIndex !== -1) {
                // A circle was clicked in edit mode, remove it.
                const circleToRemove = allCircles[clickedCircleIndex];
                
                setDetectedCircles(prev => prev.filter(c => c !== circleToRemove));
                setManualCircles(prev => prev.filter(c => c !== circleToRemove));
                
                showToast('Point removed.', 'success');
                // After removing a point, the indices are shifted, so we must clear selection.
                clearSelection();
            } else {
                // Clicked on empty space in edit mode, add a new manual circle.
                const avgRadius = allCircles.length > 0 ? allCircles.reduce((acc, c) => acc + c.radius, 0) / allCircles.length : 10;
                setManualCircles(prev => [...prev, { x: point.x, y: point.y, radius: avgRadius }]);
                showToast('Manual point added.', 'success');
            }
        } else { // For 'distance' and 'stddev' modes, handle selection
            if (clickedCircleIndex !== -1) {
                const isSelected = selectedIndices.includes(clickedCircleIndex);
                if (isSelected) {
                    setSelectedIndices(prev => prev.filter(i => i !== clickedCircleIndex));
                } else {
                     if (mode === 'distance' && selectedIndices.length >= 2) {
                        showToast('Max 2 points for distance. Clear selection to choose others.', 'info');
                        return;
                    }
                    setSelectedIndices(prev => [...prev, clickedCircleIndex]);
                }
            }
        }
    };

    const clearSelection = () => {
        setSelectedIndices([]);
    };
    
    useEffect(() => {
        clearSelection();
    }, [mode]);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) {
            handleImageUpload(file);
        } else {
            showToast('Please drop an image file.', 'error');
        }
        e.dataTransfer.clearData();
      }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    };

    if (!openCvReady) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 text-gray-300">
                <LoaderIcon className="h-12 w-12 animate-spin text-cyan-400" />
                <p className="mt-4 text-lg">Initializing OpenCV.js...</p>
            </div>
        );
    }
    
    return (
        <div 
          className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col p-4 lg:flex-row lg:space-x-4"
          onDrop={handleDrop} 
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
        >
            <Toast toast={toast} />
            <div className="w-full lg:w-80 flex-shrink-0 bg-gray-800 rounded-lg shadow-xl p-4 flex flex-col space-y-4 h-full">
                <header className="text-center pb-2 border-b border-gray-700">
                    <h1 className="text-2xl font-bold text-cyan-400">🎯 Target Analyzer</h1>
                </header>
                <ControlPanel
                    mode={mode}
                    setMode={setMode}
                    bulletDiameter={bulletDiameterMM}
                    setBulletDiameter={setBulletDiameterMM}
                    onImageUpload={handleImageUpload}
                    onClearSelection={clearSelection}
                    selectedCount={selectedIndices.length}
                    houghParams={houghParams}
                    setHoughParams={setHoughParams}
                    onRedetect={detectCircles}
                    isImageLoaded={!!image}
                />
                {image && (
                  <ResultsPanel
                      scale={scale}
                      distance={distance}
                      groupMetrics={groupMetrics}
                      bulletDiameter={bulletDiameterMM}
                      selectedCount={selectedIndices.length}
                      mode={mode}
                      totalPoints={allCircles.length}
                  />
                )}
                <footer className="text-center pt-4 mt-auto text-xs text-gray-500">
                    <p>by Ali Al-Sardi</p>
                </footer>
            </div>

            <main className="flex-grow mt-4 lg:mt-0 bg-gray-800 rounded-lg shadow-xl p-2 flex items-center justify-center relative">
                {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                         <LoaderIcon className="h-10 w-10 animate-spin text-cyan-400" />
                         <span className="ml-3 text-white">Detecting holes...</span>
                    </div>
                )}
                {isDragging && (
                   <div className="absolute inset-0 bg-gray-900 bg-opacity-70 border-4 border-dashed border-cyan-400 rounded-lg flex items-center justify-center z-30 pointer-events-none">
                      <p className="text-2xl font-bold text-white">Drop Image Here</p>
                   </div>
                )}
                {image ? (
                    <CanvasComponent
                        image={image}
                        circles={allCircles}
                        selectedIndices={selectedIndices}
                        onCanvasClick={handleCanvasClick}
                        mode={mode}
                    />
                ) : (
                    <div className="text-center text-gray-400 flex flex-col items-center">
                        <TargetIcon className="w-24 h-24 text-gray-600 mb-4" />
                        <h2 className="text-xl font-semibold">Upload a Target Image</h2>
                        <p className="mt-2">Use the controls to select a file or drag & drop one here.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;