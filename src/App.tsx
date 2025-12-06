
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useOpenCv } from '../hooks/useOpenCv';
import type { Circle, Point, Mode, ToastMessage, GroupMetrics } from '../types';
import { ControlPanel } from '../components/ControlPanel';
import { CanvasComponent, CanvasHandle } from '../components/CanvasComponent';
import { ResultsPanel } from '../components/ResultsPanel';
import { Toast } from '../components/Toast';
import { ZoomControls } from '../components/ZoomControls';
import { ContactModal } from '../components/ContactModal';
import { LoaderIcon, TargetIcon } from '../components/icons';

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
    const [showContact, setShowContact] = useState<boolean>(false);
    
    const imageRef = useRef<HTMLImageElement | null>(null);
    const canvasRef = useRef<CanvasHandle>(null);

    const allCircles = [...detectedCircles, ...manualCircles];

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    
    const loadProjectDefault = useCallback(() => {
        const img = new Image();
        img.onload = () => {
            setImage(img);
            imageRef.current = img;
        };
        img.onerror = () => {
            console.error("Failed to load default target image from /default-target.png. Please ensure the file exists in the public directory.");
            showToast('Error: Default target image could not be loaded.', 'error');
        };
        img.src = '/default-target.png';
    }, []);

    useEffect(() => {
        loadProjectDefault();
    }, [loadProjectDefault]);
    
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
        if (keepImage) {
            canvasRef.current?.resetZoom();
        }
    };

    const handleImageUpload = (file: File) => {
        if (file) {
            resetState();
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                
                const img = new Image();
                img.onload = () => {
                    setImage(img);
                    imageRef.current = img;
                };
                img.src = result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAsDefault = () => {
        if (!imageRef.current) return;
        
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = imageRef.current;
            
            const maxDim = 1280;
            let width = img.naturalWidth;
            let height = img.naturalHeight;
            
            if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                localStorage.setItem('target_analyzer_default_image', dataUrl);
                showToast('Current image saved as startup default.', 'success');
            }
        } catch (error) {
            console.error('Failed to save default image', error);
            showToast('Failed to save: Image likely too complex for storage.', 'error');
        }
    };

    const handleResetDefault = () => {
        localStorage.removeItem('target_analyzer_default_image');
        resetState();
        loadProjectDefault();
        showToast('Restored project default image.', 'success');
    };
    
    const detectCircles = useCallback(() => {
        if (!openCvReady || !image) return;
        
        setIsProcessing(true);
        setDetectedCircles([]);
        setSelectedIndices([]);

        setTimeout(() => { 
            try {
                const cv = window.cv;
                const src = cv.imread(image);
                const gray = new cv.Mat();
                cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
                cv.GaussianBlur(gray, gray, new cv.Size(9, 9), 2, 2);

                const circles = new cv.Mat();
                cv.HoughCircles(gray, circles, cv.HOUGH_GRADIENT, 1, 15, 100, 20, 5, 25);
                
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
    }, [image, openCvReady]);

    useEffect(() => {
        if (image && openCvReady) {
            detectCircles();
        }
    }, [image, openCvReady, detectCircles]);
    
    useEffect(() => {
        if (image) {
            setScale(4.3165467625899280575539568345324);
        } else {
            setScale(null);
        }
    }, [image]);


    const calculateMetrics = useCallback(() => {
        const selectedCircles = selectedIndices.map(i => allCircles[i]);

        if (mode === 'distance') {
            if (selectedCircles.length === 2 && scale) {
                const [c1, c2] = selectedCircles;
                const dx = (c1.x - c2.x) / scale;
                const dy = (c1.y - c2.y) / scale;
                const dist = Math.sqrt(dx * dx + dy * dy);
                setDistance(dist);
            } else {
                setDistance(null); 
            }
        }

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
                
                setGroupMetrics({ stdDev, meanRadius, extremeSpread, count: n });
            } else {
                setGroupMetrics(null); 
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
                const circleToRemove = allCircles[clickedCircleIndex];
                setDetectedCircles(prev => prev.filter(c => c !== circleToRemove));
                setManualCircles(prev => prev.filter(c => c !== circleToRemove));
                showToast('Point removed.', 'success');
                clearSelection();
            } else {
                const avgRadius = allCircles.length > 0 ? allCircles.reduce((acc, c) => acc + c.radius, 0) / allCircles.length : 10;
                setManualCircles(prev => [...prev, { x: point.x, y: point.y, radius: avgRadius }]);
                showToast('Manual point added.', 'success');
            }
        } else { 
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
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('image/')) { handleImageUpload(file); } else { showToast('Please drop an image file.', 'error'); }
        e.dataTransfer.clearData();
      }
    };
    const handleDragOver = (e: React.DragEvent<HHTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };

    return (
        <div 
          className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col p-4 lg:flex-row lg:space-x-4 lg:h-screen lg:overflow-hidden"
          onDrop={handleDrop} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave}
        >
            <Toast toast={toast} />
            <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
            
            <div className="w-full lg:w-80 flex-shrink-0 bg-gray-800 rounded-lg shadow-xl p-4 flex flex-col space-y-4 lg:overflow-y-auto">
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
                    onSaveDefault={handleSaveAsDefault}
                    onResetDefault={handleResetDefault}
                    hasImage={!!image}
                    isCvReady={openCvReady}
                />
                {image && ( <ResultsPanel scale={scale} distance={distance} groupMetrics={groupMetrics} bulletDiameter={bulletDiameterMM} selectedCount={selectedIndices.length} mode={mode} totalPoints={allCircles.length} /> )}
                <footer className="text-center pt-4 mt-auto text-xs text-gray-500">
                    <div className="mt-2 flex justify-center space-x-2 items-center">
                        <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Privacy</a>
                        <span>•</span>
                        <a href="/terms-and-conditions.html" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors">Terms</a>
                        <span>•</span>
                        <button onClick={() => setShowContact(true)} className="hover:text-cyan-400 transition-colors">Contact</button>
                    </div>
                </footer>
            </div>

            <main className="flex-grow mt-4 lg:mt-0 bg-gray-800 rounded-lg shadow-xl relative overflow-hidden">
                {isProcessing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                         <LoaderIcon className="h-10 w-10 animate-spin text-cyan-400" />
                         <span className="ml-3 text-white">Detecting holes...</span>
                    </div>
                )}
                {!openCvReady && !isProcessing && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded-sm text-xs z-20">
                        <span>OpenCV is loading...</span>
                    </div>
                )}
                {isDragging && (
                   <div className="absolute inset-0 bg-gray-900 bg-opacity-70 border-4 border-dashed border-cyan-400 rounded-lg flex items-center justify-center z-30 pointer-events-none">
                      <p className="text-2xl font-bold text-white">Drop Target Here</p>
                   </div>
                )}
                {image ? (
                    <>
                        <CanvasComponent
                            ref={canvasRef}
                            image={image}
                            circles={allCircles}
                            selectedIndices={selectedIndices}
                            onCanvasClick={handleCanvasClick}
                            mode={mode}
                            groupMetrics={groupMetrics}
                        />
                        <ZoomControls
                            onZoomIn={() => canvasRef.current?.zoomIn()}
                            onZoomOut={() => canvasRef.current?.zoomOut()}
                            onZoomToFit={() => canvasRef.current?.resetZoom()}
                            onZoomToSelection={() => canvas.current?.zoomToSelection()}
                            selectionCount={selectedIndices.length}
                        />
                    </>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <TargetIcon className="w-24 h-24 opacity-20" />
                        <p className="text-lg">Upload a target or drop one here to begin</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;
