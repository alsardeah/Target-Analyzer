
import { useState, useEffect } from 'react';

declare global {
    interface Window {
        cv: any;
    }
}

export const useOpenCv = () => {
    const [openCvReady, setOpenCvReady] = useState(false);

    useEffect(() => {
        const checkCv = () => {
            if (window.cv && window.cv.imread) {
                setOpenCvReady(true);
            } else {
                setTimeout(checkCv, 100);
            }
        };
        checkCv();
    }, []);

    return { openCvReady };
};
