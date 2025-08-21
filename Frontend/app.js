class EnhancedVastuCalculator {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3001/api';
        this.lastCalculation = null;
        this.astrologyAnalysis = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.loadSampleData();
        });
    }

    setupEventListeners() {
        const form = document.getElementById('vastuForm');
        const remedyButton = document.getElementById('generateRemedies');
        const astrologyButton = document.getElementById('analyzeAstrology');

        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        if (remedyButton) {
            remedyButton.addEventListener('click', () => this.generateAIRemedies());
        }

        if (astrologyButton) {
            astrologyButton.addEventListener('click', () => this.analyzeAstrology());
        }
    }

    loadSampleData() {
        const sampleData = {
            name: 'Aman Kumar',
            
            birthDate: '2000-08-18',
            birthTime: '14:30',
            birthPlace: 'Delhi, India',
            entrance: 'North',
            masterBedroom: 'North',
            kitchen: 'North',
            bathroom: 'North',
            poojaRoom: 'North',
            livingRoom: 'North',
            plotShape: 'Sher Mukha',
            floorNumber: 22,
            houseNumber: 2210
        };

        Object.entries(sampleData).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
            }
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (!this.validateForm(data)) {
            return;
        }

        const results = this.calculateVastuScore(data);
        this.lastCalculation = results;
        
        this.displayResults(results);
        
        // Automatically analyze astrology if birth details are available
        if (data.birthDate) {
            this.analyzeAstrology();
        }
    }

    validateForm(data) {
    const required = ['name', 'birthDate', 'birthPlace', 'entrance', 'masterBedroom', 'kitchen', 'bathroom', 'poojaRoom', 'livingRoom', 'plotShape', 'floorNumber', 'houseNumber'];
        
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
                return false;
            }
        }
        return true;
    }

    calculateVastuScore(data) {
        const roomScores = {
            'Entrance': this.getRoomScore('Entrance', data.entrance),
            'Master Bedroom': this.getRoomScore('Master Bedroom', data.masterBedroom),
            'Kitchen': this.getRoomScore('Kitchen', data.kitchen),
            'Bathroom': this.getRoomScore('Bathroom', data.bathroom),
            'Pooja Room': this.getRoomScore('Pooja Room', data.poojaRoom),
            'Living Room': this.getRoomScore('Living Room', data.livingRoom)
        };

        const avgRoomScore = Object.values(roomScores).reduce((a, b) => a + b, 0) / Object.keys(roomScores).length;
        const plotShapeScore = this.getPlotShapeScore(data.plotShape);
        const floorScore = this.getFloorScore(parseInt(data.floorNumber));
        const numerologyScore = this.getNumerologyScore(data.birthDate, data.houseNumber);

        // Calculate individual numerology scores for each room direction
        const roomNumerologyScores = this.calculateRoomNumerologyScores(data, roomScores);

        // Base Vastu score (will be enhanced with astrology later)
        const baseVastuScore = Math.round(
            avgRoomScore * 0.35 +
            plotShapeScore * 0.15 +
            numerologyScore * 0.15 +
            floorScore * 0.10 +
            50 * 0.25  // Reserve 25% for astrology integration
        );

        return {
            finalScore: baseVastuScore,
            roomScores,
            roomNumerologyScores,
            plotShapeScore,
            floorScore,
            numerologyScore,
            interpretation: this.getInterpretation(baseVastuScore),
            buyerDetails: {
                name: data.name,
                birthDate: data.birthDate,
                birthTime: data.birthTime,
                birthPlace: data.birthPlace
            },
            propertyDetails: {
                houseNumber: parseInt(data.houseNumber),
                floorNumber: parseInt(data.floorNumber),
                plotShape: data.plotShape,
                entrance: data.entrance,
                masterBedroom: data.masterBedroom,
                kitchen: data.kitchen,
                bathroom: data.bathroom,
                poojaRoom: data.poojaRoom,
                livingRoom: data.livingRoom
            }
        };
    }

    calculateRoomNumerologyScores(data, roomScores) {
        const birthNumber = this.calculateBirthNumber(data.birthDate);
        const houseNumber = this.calculateHouseNumber(data.houseNumber);
        
        const roomNumerologyScores = {};
        
        Object.keys(roomScores).forEach(room => {
            const direction = data[this.getRoomKey(room)];
            const directionNumber = this.getDirectionNumber(direction);
            
            // Calculate compatibility between birth number and direction
            const compatibility = this.calculateDirectionalNumerologyCompatibility(birthNumber, directionNumber, houseNumber);
            roomNumerologyScores[room] = compatibility;
        });
        
        return roomNumerologyScores;
    }

    getDirectionNumber(direction) {
        const directionNumbers = {
            'North': 1,
            'Northeast': 2,
            'East': 3,
            'Southeast': 4,
            'South': 9,
            'Southwest': 8,
            'West': 7,
            'Northwest': 6
        };
        return directionNumbers[direction] || 5;
    }

    calculateDirectionalNumerologyCompatibility(birthNum, directionNum, houseNum) {
        // Advanced numerology compatibility calculation
        const primaryCompatibility = Math.abs(birthNum - directionNum) <= 2 ? 85 : 60;
        const houseAdjustment = (birthNum + houseNum) % 9 === directionNum % 9 ? 15 : -10;
        
        return Math.max(20, Math.min(100, primaryCompatibility + houseAdjustment));
    }

    async analyzeAstrology() {
        if (!this.lastCalculation) {
            alert('Please calculate Vastu score first!');
            return;
        }

        const astrologyButton = document.getElementById('analyzeAstrology');
        const loading = astrologyButton.querySelector('.loading');

        try {
            astrologyButton.disabled = true;
            loading.style.display = 'inline';
            this.showAstrologyLoading();

            const requestData = {
                birthDetails: this.lastCalculation.buyerDetails,
                propertyDirections: this.lastCalculation.propertyDetails
            };

            const response = await fetch(`${this.apiBaseUrl}/analyze-astrology`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`Astrology API Error: ${response.status}`);
            }

            const result = await response.json();
            this.astrologyAnalysis = result;
            
            // Update the Vastu score with astrology integration
            this.updateScoreWithAstrology(result);
            
            // Update room breakdown with astrology data
            this.updateRoomBreakdownWithAstrology(result);
            
            this.displayAstrologyResults(result);

        } catch (error) {
            console.error('Failed to analyze astrology:', error);
            this.showAstrologyError(error.message);
        } finally {
            astrologyButton.disabled = false;
            loading.style.display = 'none';
        }
    }

    updateScoreWithAstrology(astrologyResult) {
        if (!this.lastCalculation || !astrologyResult) return;

        const astrologyScore = astrologyResult.directionalCompatibility.overallScore;
        
        // Recalculate final score with astrology integration (25% weight)
        const roomScore = Object.values(this.lastCalculation.roomScores).reduce((a, b) => a + b, 0) / 6;
        
        const enhancedFinalScore = Math.round(
            roomScore * 0.35 +
            this.lastCalculation.plotShapeScore * 0.15 +
            this.lastCalculation.numerologyScore * 0.15 +
            this.lastCalculation.floorScore * 0.10 +
            astrologyScore * 0.25  // Astrology integration
        );

        // Update the score display
        this.lastCalculation.finalScore = enhancedFinalScore;
        this.lastCalculation.astrologyScore = astrologyScore;
        this.lastCalculation.interpretation = this.getInterpretation(enhancedFinalScore);

        // Update UI
        document.getElementById('finalScore').textContent = enhancedFinalScore;
        document.getElementById('interpretation').textContent = this.lastCalculation.interpretation.level;
        document.getElementById('description').textContent = this.lastCalculation.interpretation.desc;
    }

    updateRoomBreakdownWithAstrology(astrologyResult) {
        // Re-render room breakdown with astrology data
        this.displayMultiDimensionalAnalysis();
    }

    displayMultiDimensionalAnalysis() {
        const roomBreakdown = document.getElementById('roomBreakdown');
        if (!roomBreakdown || !this.lastCalculation) return;

        roomBreakdown.innerHTML = '';

        // Add directional recommendation section first
        const recommendationSection = document.createElement('div');
        recommendationSection.className = 'directional-recommendations';
        recommendationSection.innerHTML = this.createDirectionalRecommendations();
        roomBreakdown.appendChild(recommendationSection);

        // Add room analysis
        Object.entries(this.lastCalculation.roomScores).forEach(([room, vastuScore]) => {
            const roomElement = document.createElement('div');
            roomElement.className = `analysis-item ${this.getOverallRoomClass(room)}`;
            
            const currentDirection = this.lastCalculation.propertyDetails[this.getRoomKey(room)];
            const numerologyScore = this.lastCalculation.roomNumerologyScores?.[room] || 0;
            const astrologyScore = this.astrologyAnalysis?.directionalCompatibility?.roomAnalysis?.[this.getRoomKey(room)]?.score || 0;
            const astrologyCompatible = this.astrologyAnalysis?.directionalCompatibility?.roomAnalysis?.[this.getRoomKey(room)]?.compatible || false;
            
            // Calculate overall room score
            const overallScore = Math.round((vastuScore * 0.5) + (numerologyScore * 0.25) + (astrologyScore * 0.25));
            
            roomElement.innerHTML = `
                <div class="analysis-header">
                    <div class="room-name">${room}</div>
                    <div class="overall-score">${overallScore}/100</div>
                </div>
                <div class="current-direction">
                    <strong>Current Direction:</strong> ${currentDirection}
                </div>
                <div class="analysis-breakdown">
                    <div class="score-component vastu">
                        <div class="component-label">
                            <span class="icon">🏠</span>
                            <span>Vastu Score</span>
                        </div>
                        <div class="component-score ${this.getScoreClass(vastuScore)}">${vastuScore}/100</div>
                    </div>
                    <div class="score-component numerology">
                        <div class="component-label">
                            <span class="icon">🔢</span>
                            <span>Numerology</span>
                        </div>
                        <div class="component-score ${this.getScoreClass(numerologyScore)}">${numerologyScore}/100</div>
                    </div>
                    <div class="score-component astrology">
                        <div class="component-label">
                            <span class="icon">⭐</span>
                            <span>Astrology</span>
                        </div>
                        <div class="component-score ${this.getScoreClass(astrologyScore)}">
                            ${astrologyScore}/100
                            <span class="compatibility-indicator">${astrologyCompatible ? '✅' : '⚠️'}</span>
                        </div>
                    </div>
                </div>
                ${this.getBestDirectionsForRoom(room)}
            `;
            roomBreakdown.appendChild(roomElement);
        });
    }

    createDirectionalRecommendations() {
        if (!this.astrologyAnalysis) {
            return `
                <div class="recommendation-card">
                    <h4>🧭 Directional Analysis</h4>
                    <p>Complete astrology analysis to see personalized directional recommendations.</p>
                </div>
            `;
        }

        const { astrologyProfile } = this.astrologyAnalysis;
        const currentEntrance = this.lastCalculation.propertyDetails.entrance;
        
        return `
            <div class="recommendation-card">
                <h4>🧭 Your Personalized Directional Profile</h4>
                <div class="recommendation-grid">
                    <div class="recommendation-section best-directions">
                        <h5>🌟 Best Directions for You</h5>
                        <div class="direction-badges">
                            ${astrologyProfile.favorableDirections?.map(dir => 
                                `<span class="direction-badge best ${dir === currentEntrance ? 'current-match' : ''}">${dir}</span>`
                            ).join('') || '<span class="no-data">Not calculated</span>'}
                        </div>
                    </div>
                    <div class="recommendation-section lucky-directions">
                        <h5>🍀 Lucky for Residence</h5>
                        <div class="direction-badges">
                            ${astrologyProfile.luckyDirections?.map(dir => 
                                `<span class="direction-badge lucky ${dir === currentEntrance ? 'current-match' : ''}">${dir}</span>`
                            ).join('') || '<span class="no-data">Not calculated</span>'}
                        </div>
                    </div>
                    <div class="recommendation-section current-property">
                        <h5>🏠 Your Current Property</h5>
                        <div class="current-analysis">
                            <div class="current-entrance">
                                <strong>Main Entrance:</strong> 
                                <span class="direction-badge current">${currentEntrance}</span>
                                ${this.getEntranceCompatibilityText(currentEntrance)}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="recommendation-summary">
                    ${this.getOverallDirectionalAdvice(currentEntrance)}
                </div>
            </div>
        `;
    }

    getEntranceCompatibilityText(currentEntrance) {
        if (!this.astrologyAnalysis) return '';
        
        const { favorableDirections, luckyDirections } = this.astrologyAnalysis.astrologyProfile;
        
        if (favorableDirections?.includes(currentEntrance)) {
            return '<span class="compatibility-text excellent">🎯 Perfect Match!</span>';
        } else if (luckyDirections?.includes(currentEntrance)) {
            return '<span class="compatibility-text good">✨ Lucky Direction!</span>';
        } else {
            return '<span class="compatibility-text needs-remedy">⚡ Needs Remedies</span>';
        }
    }

    getOverallDirectionalAdvice(currentEntrance) {
        if (!this.astrologyAnalysis) return '';
        
        const { favorableDirections, luckyDirections } = this.astrologyAnalysis.astrologyProfile;
        
        if (favorableDirections?.includes(currentEntrance)) {
            return `
                <div class="advice-box excellent">
                    <strong>🎉 Excellent Alignment!</strong> Your main entrance faces ${currentEntrance}, which is one of your most favorable directions. This supports your natural energy flow and life goals.
                </div>
            `;
        } else if (luckyDirections?.includes(currentEntrance)) {
            return `
                <div class="advice-box good">
                    <strong>✨ Good Compatibility!</strong> Your main entrance faces ${currentEntrance}, which is considered lucky for your residence. This brings positive energy to your home.
                </div>
            `;
        } else {
            return `
                <div class="advice-box needs-attention">
                    <strong>⚡ Enhancement Opportunity!</strong> Your main entrance faces ${currentEntrance}. Consider astro-Vastu remedies to harmonize this direction with your personal energy. Your ideal directions are: ${favorableDirections?.join(', ') || 'Not calculated'}.
                </div>
            `;
        }
    }

    getBestDirectionsForRoom(room) {
        const roomDirectionRecommendations = {
            'Entrance': ['North', 'East', 'Northeast'],
            'Master Bedroom': ['South', 'Southwest', 'West'],
            'Kitchen': ['Southeast', 'South', 'East'],
            'Bathroom': ['Northwest', 'West', 'South'],
            'Pooja Room': ['Northeast', 'North', 'East'],
            'Living Room': ['North', 'East', 'Northeast']
        };

        const bestDirections = roomDirectionRecommendations[room] || [];
        const currentDirection = this.lastCalculation.propertyDetails[this.getRoomKey(room)];
        
        return `
            <div class="room-recommendations">
                <div class="best-directions-label">Ideal Directions:</div>
                <div class="best-directions-list">
                    ${bestDirections.map(dir => 
                        `<span class="mini-direction-badge ${dir === currentDirection ? 'current' : ''}">${dir}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }

    getOverallRoomClass(room) {
        if (!this.lastCalculation) return 'average';
        
        const vastuScore = this.lastCalculation.roomScores[room] || 0;
        const numerologyScore = this.lastCalculation.roomNumerologyScores?.[room] || 0;
        const astrologyScore = this.astrologyAnalysis?.directionalCompatibility?.roomAnalysis?.[this.getRoomKey(room)]?.score || 0;
        
        const overallScore = Math.round((vastuScore * 0.5) + (numerologyScore * 0.25) + (astrologyScore * 0.25));
        
        return this.getScoreClass(overallScore);
    }

    showAstrologyLoading() {
        const resultsDiv = document.getElementById('astrologyResults');
        
        resultsDiv.innerHTML = `
            <div class="astrology-header">
                <h3>🔮 Analyzing Your Astrological Profile...</h3>
            </div>
            <div class="astrology-loading">
                <div class="spinner"></div>
                <p>Calculating planetary positions and directional compatibility...</p>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
    }

    displayAstrologyResults(results) {
        const resultsDiv = document.getElementById('astrologyResults');
        const { astrologyProfile, directionalCompatibility } = results;
        
        resultsDiv.innerHTML = `
            <div class="astrology-header">
                <h3>🔮 Your Astrological Profile & Property Compatibility</h3>
            </div>
            <div class="astrology-content">
                <div class="astrology-section profile">
                    <h4 class="astrology-section-title">
                        <span>⭐</span>
                        Personal Astrological Profile
                    </h4>
                    <div class="profile-grid">
                        <div class="profile-item">
                            <strong>Planetary Ruler:</strong> ${astrologyProfile.planetaryRuler}
                        </div>
                        <div class="profile-item">
                            <strong>Moon Sign:</strong> ${astrologyProfile.moonSign}
                        </div>
                        <div class="profile-item">
                            <strong>Birth Star:</strong> ${astrologyProfile.birthStar}
                        </div>
                        <div class="profile-item">
                            <strong>Birth Element:</strong> ${astrologyProfile.birthElement}
                        </div>
                        <div class="profile-item">
                            <strong>Life Number:</strong> ${astrologyProfile.lifeNumber}
                        </div>
                    </div>
                </div>

                <div class="astrology-section compatibility">
                    <h4 class="astrology-section-title">
                        <span>🏠</span>
                        Property Compatibility Analysis
                    </h4>
                    <div class="compatibility-score">
                        <div class="score-circle astrology">
                            <span class="score-value">${directionalCompatibility.overallScore}</span>
                            <span class="score-label">/100</span>
                        </div>
                        <div class="score-interpretation">
                            <h5>${this.getAstrologyScoreLevel(directionalCompatibility.overallScore)}</h5>
                            <p>${directionalCompatibility.recommendation}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="astrology-meta">
                <p>Analysis generated on: ${new Date().toLocaleString()}</p>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    formatRoomName(room) {
        const names = {
            'entrance': 'Main Entrance',
            'masterBedroom': 'Master Bedroom',
            'kitchen': 'Kitchen',
            'bathroom': 'Bathroom',
            'poojaRoom': 'Pooja Room',
            'livingRoom': 'Living Room'
        };
        return names[room] || room;
    }

    getAstrologyScoreLevel(score) {
        if (score >= 80) return 'Excellent Alignment';
        if (score >= 65) return 'Good Compatibility';
        if (score >= 45) return 'Moderate Alignment';
        return 'Needs Astrological Remedies';
    }

    async generateAIRemedies() {
        if (!this.lastCalculation) {
            alert('Please calculate Vastu score first!');
            return;
        }

        const button = document.getElementById('generateRemedies');
        const loading = button.querySelector('.loading');

        try {
            button.disabled = true;
            loading.style.display = 'inline';
            this.showRemedyLoading();

            const requestData = {
                vastuAnalysis: {
                    finalScore: this.lastCalculation.finalScore,
                    roomScores: this.lastCalculation.roomScores,
                    issues: this.identifyIssues()
                },
                buyerDetails: this.lastCalculation.buyerDetails,
                propertyDetails: this.lastCalculation.propertyDetails,
                astrologyAnalysis: this.astrologyAnalysis // Include astrology data
            };

            const response = await fetch(`${this.apiBaseUrl}/generate-vastu-remedies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            console.log('🔍 Raw remedy result:', result); // Debug log
            this.displayRemedies(result.remedies);

        } catch (error) {
            console.error('❌ Failed to generate remedies:', error);
            this.showRemedyError(error.message);
        } finally {
            button.disabled = false;
            loading.style.display = 'none';
        }
    }

    showAstrologyError(message) {
        const resultsDiv = document.getElementById('astrologyResults');
        
        resultsDiv.innerHTML = `
            <div class="astrology-header">
                <h3>⚠️ Astrology Analysis Error</h3>
            </div>
            <div class="astrology-error">
                <h4>❌ Unable to Complete Analysis</h4>
                <p>${message}</p>
                <button onclick="document.getElementById('astrologyResults').style.display='none'" class="btn-primary" style="margin-top: 15px;">
                    Close
                </button>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
    }

    getRoomScore(room, direction) {
        const scores = {
            'Entrance': {
                'North': 90, 'East': 95, 'South': 30, 'West': 70,
                'Northeast': 100, 'Northwest': 75, 'Southeast': 60, 'Southwest': 25
            },
            'Master Bedroom': {
                'North': 40, 'East': 50, 'South': 70, 'West': 75,
                'Northeast': 25, 'Northwest': 60, 'Southeast': 65, 'Southwest': 100
            },
            'Kitchen': {
                'North': 30, 'East': 70, 'South': 85, 'West': 40,
                'Northeast': 20, 'Northwest': 35, 'Southeast': 100, 'Southwest': 60
            },
            'Bathroom': {
                'North': 60, 'East': 70, 'South': 80, 'West': 75,
                'Northeast': 25, 'Northwest': 100, 'Southeast': 85, 'Southwest': 90
            },
            'Pooja Room': {
                'North': 85, 'East': 90, 'South': 40, 'West': 60,
                'Northeast': 100, 'Northwest': 50, 'Southeast': 30, 'Southwest': 25
            },
            'Living Room': {
                'North': 90, 'East': 100, 'South': 60, 'West': 70,
                'Northeast': 95, 'Northwest': 85, 'Southeast': 75, 'Southwest': 50
            }
        };

        return scores[room]?.[direction] || 50;
    }

    getPlotShapeScore(shape) {
        const scores = {
            'Square': 100, 'Rectangle': 95, 'Sher Mukha': 85, 'Gau Mukha': 90,
            'Triangular': 30, 'Circular': 40, 'Irregular': 25
        };
        return scores[shape] || 50;
    }

    getFloorScore(floor) {
        if (floor === 0) return 85;
        if (floor === 1) return 90;
        if (floor === 2) return 85;
        if (floor === 3) return 80;
        if (floor === 4) return 75;
        return 70;
    }

    getNumerologyScore(birthDate, houseNumber) {
        if (!birthDate) return 70;
        const birthNum = this.calculateBirthNumber(birthDate);
        const houseNum = this.calculateHouseNumber(houseNumber);
        const compatibility = {
            1: [1, 3, 5, 7, 9], 2: [2, 4, 6, 8], 3: [1, 3, 6, 9],
            4: [1, 2, 4, 7, 8], 5: [1, 5, 9], 6: [2, 3, 6, 9],
            7: [1, 4, 7], 8: [2, 4, 6, 8], 9: [1, 3, 5, 6, 9]
        };
        return compatibility[birthNum]?.includes(houseNum) ? 90 : 70;
    }

    calculateBirthNumber(birthDate) {
        const date = new Date(birthDate);
        const dateStr = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear()}`;
        let total = dateStr.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
        while (total > 9) {
            total = total.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
        }
        return total;
    }

    calculateHouseNumber(houseNo) {
        let total = houseNo.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
        while (total > 9) {
            total = total.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
        }
        return total;
    }

    getInterpretation(score) {
        if (score >= 85) return { level: 'Excellent', desc: 'Outstanding multi-dimensional alignment' };
        if (score >= 70) return { level: 'Good', desc: 'Favorable alignment with minor improvements needed' };
        if (score >= 55) return { level: 'Average', desc: 'Moderate compliance, targeted remedies recommended' };
        return { level: 'Poor', desc: 'Significant issues, comprehensive remedies needed' };
    }

    displayResults(results) {
        const resultsSection = document.getElementById('results');
        const finalScore = document.getElementById('finalScore');
        const interpretation = document.getElementById('interpretation');
        const description = document.getElementById('description');

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        finalScore.textContent = results.finalScore;
        interpretation.textContent = results.interpretation.level;
        description.textContent = results.interpretation.desc;

        const scoreCircle = document.querySelector('.score-circle');
        scoreCircle.className = 'score-circle ' + results.interpretation.level.toLowerCase();

        // Use the new multi-dimensional analysis display
        this.displayMultiDimensionalAnalysis();
    }

    getRoomKey(roomName) {
        const mapping = {
            'Entrance': 'entrance', 'Master Bedroom': 'masterBedroom', 'Kitchen': 'kitchen',
            'Bathroom': 'bathroom', 'Pooja Room': 'poojaRoom', 'Living Room': 'livingRoom'
        };
        return mapping[roomName] || '';
    }

    getScoreClass(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 55) return 'average';
        return 'poor';
    }

    showRemedyLoading() {
        const resultsDiv = document.getElementById('remedyResults');
        
        resultsDiv.innerHTML = `
            <div class="remedy-header">
                <h3>🤖 Generating Enhanced AI Remedies...</h3>
            </div>
            <div class="remedy-loading">
                <div class="spinner"></div>
                <p>Creating personalized Vastu-Astrology-Numerology remedies based on your profile...</p>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
    }

    displayRemedies(remedies) {
        console.log('🔍 Displaying remedies:', remedies);
        
        const resultsDiv = document.getElementById('remedyResults');
        
        // Simple approach - just display the content directly with basic formatting
        let content = remedies.content || 'No content received';
        
        // Clean up escaped characters
        content = content
            .replace(/\n/g, '<br>')
            .replace(/\\\*/g, '')
            .replace(/\*\*/g, '')
            .replace(/\\"/g, '"')
            .replace(/\\\[/g, '[')
            .replace(/\\\]/g, ']');
        
        console.log('🔍 Cleaned content:', content);
        
        resultsDiv.innerHTML = `
            <div class="remedy-header">
                <h3>🤖 Enhanced Multi-Dimensional Remedies</h3>
            </div>
            <div class="remedy-content">
                <div class="remedy-section general">
                    <h4 class="remedy-section-title">
                        <span>💡</span>
                        Your Personalized Remedies
                    </h4>
                    <div style="line-height: 1.8; font-size: 15px; white-space: pre-wrap;">
                        ${content}
                    </div>
                </div>
            </div>
            <div class="remedy-meta">
                <p>Enhanced analysis generated on: ${new Date().toLocaleString()} | Model: ${remedies.model || 'gpt-4o'} | Chunks: ${remedies.chunks || 'N/A'}</p>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        console.log('✅ Remedies displayed successfully');
    }

    identifyIssues() {
        const issues = [];
        if (this.lastCalculation) {
            Object.entries(this.lastCalculation.roomScores).forEach(([room, score]) => {
                if (score < 60) {
                    issues.push(`${room} scoring low (${score}/100)`);
                }
            });
        }
        return issues;
    }

    showRemedyError(message) {
        const resultsDiv = document.getElementById('remedyResults');
        
        resultsDiv.innerHTML = `
            <div class="remedy-header">
                <h3>⚠️ Unable to Generate Remedies</h3>
            </div>
            <div class="remedy-error">
                <h4>❌ Error Occurred</h4>
                <p>${message}</p>
                <button onclick="document.getElementById('remedyResults').style.display='none'" class="btn-primary" style="margin-top: 15px;">
                    Close
                </button>
            </div>
        `;
        
        resultsDiv.style.display = 'block';
    }
}

// Initialize the enhanced calculator
const calculator = new EnhancedVastuCalculator();
