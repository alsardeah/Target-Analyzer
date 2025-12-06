const ALLOWED_DOMAINS = [
    'targetanalyzer.online',
    'www.targetanalyzer.online',
    'target-analyzer-39592261-2f440.web.app',
    'localhost' // For local development
];

export function checkDomain(): boolean {
    // Allow from file protocol for true offline use
    if (window.location.protocol === 'file:') {
        return true;
    }
    return ALLOWED_DOMAINS.includes(window.location.hostname);
}
