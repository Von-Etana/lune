/**
 * AI Proctoring Service
 * Provides face detection and anti-cheating features for assessments
 */

// Face detection state
interface FaceDetectionState {
    isPresent: boolean;
    confidence: number;
    lastDetected: number;
    warnings: string[];
}

// Proctoring event types
export type ProctoringEventType =
    | 'face_detected'
    | 'face_lost'
    | 'multiple_faces'
    | 'tab_switch'
    | 'copy_paste'
    | 'devtools_attempt'
    | 'suspicious_typing'
    | 'llm_content_detected'
    | 'keystroke_anomaly';

export interface ProctoringEvent {
    type: ProctoringEventType;
    timestamp: number;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProctoringMetrics {
    facePresenceRate: number;         // % of time face was visible
    tabSwitchCount: number;           // Number of tab switches
    copyPasteCount: number;           // Number of paste events
    suspiciousEvents: number;         // Total suspicious events
    typingPatternScore: number;       // 0-100 score (100 = natural)
    overallIntegrityScore: number;    // 0-100 (100 = high integrity)
}

export interface ProctoringConfig {
    enableFaceDetection: boolean;
    enableTabMonitoring: boolean;
    enableCopyPasteDetection: boolean;
    enableKeystrokeAnalysis: boolean;
    faceDetectionInterval: number;    // ms between face checks
    warningThreshold: number;         // warnings before flag
}

const DEFAULT_CONFIG: ProctoringConfig = {
    enableFaceDetection: true,
    enableTabMonitoring: true,
    enableCopyPasteDetection: true,
    enableKeystrokeAnalysis: true,
    faceDetectionInterval: 2000,
    warningThreshold: 3,
};

/**
 * Proctoring Manager class
 */
export class ProctoringManager {
    private config: ProctoringConfig;
    private events: ProctoringEvent[] = [];
    private faceState: FaceDetectionState = {
        isPresent: false,
        confidence: 0,
        lastDetected: 0,
        warnings: [],
    };
    private typingPatterns: number[] = [];
    private lastKeyTime: number = 0;
    private sessionStartTime: number;
    private faceDetectionIntervalId: number | null = null;
    private videoElement: HTMLVideoElement | null = null;
    private onEventCallback: ((event: ProctoringEvent) => void) | null = null;

    constructor(config: Partial<ProctoringConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.sessionStartTime = Date.now();
    }

    /**
     * Initialize proctoring with video element
     */
    async initialize(videoElement: HTMLVideoElement): Promise<boolean> {
        this.videoElement = videoElement;

        if (this.config.enableFaceDetection) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480 }
                });
                videoElement.srcObject = stream;
                await videoElement.play();

                // Start face detection loop
                this.startFaceDetection();
                return true;
            } catch (error) {
                console.error('Failed to initialize webcam:', error);
                this.addEvent({
                    type: 'face_lost',
                    timestamp: Date.now(),
                    details: 'Webcam access denied or unavailable',
                    severity: 'high',
                });
                return false;
            }
        }
        return true;
    }

    /**
     * Start face detection loop
     */
    private startFaceDetection(): void {
        if (!this.config.enableFaceDetection) return;

        this.faceDetectionIntervalId = window.setInterval(() => {
            this.detectFace();
        }, this.config.faceDetectionInterval);
    }

    /**
     * Detect face using Canvas API (basic implementation)
     * Note: For production, use TensorFlow.js or face-api.js
     */
    private async detectFace(): Promise<void> {
        if (!this.videoElement) return;

        try {
            // Create canvas to analyze video frame
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 320;
            canvas.height = 240;
            ctx.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);

            // Basic face detection using image analysis
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const hasLikelyFace = this.analyzeFacePresence(imageData);

            if (hasLikelyFace) {
                if (!this.faceState.isPresent) {
                    this.addEvent({
                        type: 'face_detected',
                        timestamp: Date.now(),
                        details: 'Face detected in frame',
                        severity: 'low',
                    });
                }
                this.faceState.isPresent = true;
                this.faceState.lastDetected = Date.now();
                this.faceState.confidence = 0.8;
            } else {
                if (this.faceState.isPresent) {
                    this.addEvent({
                        type: 'face_lost',
                        timestamp: Date.now(),
                        details: 'Face no longer detected',
                        severity: 'medium',
                    });
                    this.faceState.warnings.push('Face not visible');
                }
                this.faceState.isPresent = false;
                this.faceState.confidence = 0;
            }
        } catch (error) {
            console.error('Face detection error:', error);
        }
    }

    /**
     * Basic face presence analysis using skin tone detection
     */
    private analyzeFacePresence(imageData: ImageData): boolean {
        const data = imageData.data;
        let skinPixels = 0;
        const totalPixels = imageData.width * imageData.height;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Simple skin tone detection
            if (this.isSkinTone(r, g, b)) {
                skinPixels++;
            }
        }

        // If more than 10% of central area has skin tone, likely a face
        const skinRatio = skinPixels / totalPixels;
        return skinRatio > 0.1 && skinRatio < 0.6;
    }

    /**
     * Check if pixel is likely skin tone
     */
    private isSkinTone(r: number, g: number, b: number): boolean {
        // HSV-based skin detection
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);

        // Skin tone ranges (various skin colors)
        const isReddish = r > 95 && g > 40 && b > 20;
        const isNotGray = max - min > 15;
        const isRDominant = r > g && r > b;

        return isReddish && isNotGray && isRDominant;
    }

    /**
     * Record tab switch event
     */
    recordTabSwitch(duration: number): void {
        if (!this.config.enableTabMonitoring) return;

        const severity = duration > 5000 ? 'high' : duration > 2000 ? 'medium' : 'low';

        this.addEvent({
            type: 'tab_switch',
            timestamp: Date.now(),
            details: `Tab was unfocused for ${(duration / 1000).toFixed(1)}s`,
            severity,
        });
    }

    /**
     * Record paste event
     */
    recordPaste(content: string): void {
        if (!this.config.enableCopyPasteDetection) return;

        // Check for LLM markers
        const llmIndicators = [
            'here is the code', 'sure,', 'generated by',
            'openai', 'gpt', 'claude', 'solution:', 'here\'s'
        ];
        const hasLLMMarkers = llmIndicators.some(marker =>
            content.toLowerCase().includes(marker)
        );

        if (hasLLMMarkers) {
            this.addEvent({
                type: 'llm_content_detected',
                timestamp: Date.now(),
                details: 'AI-generated content signature detected in paste',
                severity: 'critical',
            });
        } else if (content.length > 100) {
            this.addEvent({
                type: 'copy_paste',
                timestamp: Date.now(),
                details: `Large paste detected: ${content.length} characters`,
                severity: 'medium',
            });
        }
    }

    /**
     * Record keystroke for pattern analysis
     */
    recordKeystroke(): void {
        if (!this.config.enableKeystrokeAnalysis) return;

        const now = Date.now();
        if (this.lastKeyTime > 0) {
            const interval = now - this.lastKeyTime;
            this.typingPatterns.push(interval);

            // Keep only last 100 intervals
            if (this.typingPatterns.length > 100) {
                this.typingPatterns.shift();
            }

            // Check for suspicious patterns (too fast or perfectly regular)
            if (interval < 10) {
                this.addEvent({
                    type: 'keystroke_anomaly',
                    timestamp: now,
                    details: 'Unusually fast typing detected',
                    severity: 'medium',
                });
            }
        }
        this.lastKeyTime = now;
    }

    /**
     * Add proctoring event
     */
    private addEvent(event: ProctoringEvent): void {
        this.events.push(event);
        if (this.onEventCallback) {
            this.onEventCallback(event);
        }
    }

    /**
     * Set callback for real-time events
     */
    onEvent(callback: (event: ProctoringEvent) => void): void {
        this.onEventCallback = callback;
    }

    /**
     * Calculate overall metrics
     */
    getMetrics(): ProctoringMetrics {
        const sessionDuration = Date.now() - this.sessionStartTime;
        const faceDetectedTime = this.faceState.isPresent
            ? Date.now() - this.faceState.lastDetected
            : 0;

        // Face presence rate
        const facePresenceRate = sessionDuration > 0
            ? Math.min(100, (faceDetectedTime / sessionDuration) * 100)
            : 0;

        // Count events by type
        const tabSwitches = this.events.filter(e => e.type === 'tab_switch').length;
        const copyPastes = this.events.filter(e =>
            e.type === 'copy_paste' || e.type === 'llm_content_detected'
        ).length;
        const suspiciousEvents = this.events.filter(e =>
            e.severity === 'high' || e.severity === 'critical'
        ).length;

        // Typing pattern analysis
        let typingScore = 100;
        if (this.typingPatterns.length > 10) {
            const avg = this.typingPatterns.reduce((a, b) => a + b, 0) / this.typingPatterns.length;
            const variance = this.typingPatterns.reduce((sum, val) =>
                sum + Math.pow(val - avg, 2), 0
            ) / this.typingPatterns.length;

            // Natural typing has variance, robotic typing doesn't
            if (variance < 100) typingScore -= 30; // Too regular
            if (avg < 50) typingScore -= 20; // Too fast
        }

        // Calculate integrity score
        let integrityScore = 100;
        integrityScore -= tabSwitches * 5;
        integrityScore -= copyPastes * 10;
        integrityScore -= suspiciousEvents * 15;
        integrityScore = Math.max(0, Math.min(100, integrityScore));

        return {
            facePresenceRate,
            tabSwitchCount: tabSwitches,
            copyPasteCount: copyPastes,
            suspiciousEvents,
            typingPatternScore: Math.max(0, typingScore),
            overallIntegrityScore: integrityScore,
        };
    }

    /**
     * Get all recorded events
     */
    getEvents(): ProctoringEvent[] {
        return [...this.events];
    }

    /**
     * Check if cheating is likely
     */
    isCheatingLikely(): { likely: boolean; reason: string | null } {
        const criticalEvents = this.events.filter(e => e.severity === 'critical');
        if (criticalEvents.length > 0) {
            return {
                likely: true,
                reason: criticalEvents[0].details,
            };
        }

        const metrics = this.getMetrics();
        if (metrics.overallIntegrityScore < 50) {
            return {
                likely: true,
                reason: `Low integrity score: ${metrics.overallIntegrityScore}/100`,
            };
        }

        if (metrics.tabSwitchCount >= this.config.warningThreshold) {
            return {
                likely: true,
                reason: `Excessive tab switches: ${metrics.tabSwitchCount}`,
            };
        }

        return { likely: false, reason: null };
    }

    /**
     * Stop proctoring and cleanup
     */
    stop(): void {
        if (this.faceDetectionIntervalId) {
            clearInterval(this.faceDetectionIntervalId);
        }

        if (this.videoElement?.srcObject) {
            const stream = this.videoElement.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
}

/**
 * Create proctoring manager with default config
 */
export const createProctoringManager = (
    config?: Partial<ProctoringConfig>
): ProctoringManager => {
    return new ProctoringManager(config);
};
