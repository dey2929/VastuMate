class ComprehensiveVastuCalculator {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3001/api';
        this.analysisData = null;
        // Store analysis results for PDF generation
        this.vastuAnalysis = null;
        this.numerologyAnalysis = null;
        this.astrologyAnalysis = null;
        // Store remedies for PDF generation
        this.generatedRemedies = {
            vastu: null,
            numerology: null,
            astrology: null
        };
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
        
        // Form submission
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Remedy buttons
        document.getElementById('generateVastuRemedies')?.addEventListener('click', () => 
            this.generateRemedies('vastu'));
        document.getElementById('generateNumerologyRemedies')?.addEventListener('click', () => 
            this.generateRemedies('numerology'));
        document.getElementById('generateAstrologyRemedies')?.addEventListener('click', () => 
            this.generateRemedies('astrology'));

        // PDF Download button
        document.getElementById('downloadReport')?.addEventListener('click', () => 
            this.downloadPDFReport());
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
            houseNumber: 2210,
            houseDirection: 'North'
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

        // Reset all remedies and enable buttons for new analysis
        this.resetAllRemedies();

        // Perform all three analyses
        this.performComprehensiveAnalysis(data);
    }

    // Reset all remedy sections and enable buttons
    resetAllRemedies() {
        const remedyTypes = ['vastu', 'numerology', 'astrology'];
        
        remedyTypes.forEach(type => {
            // Clear remedy results
            const resultsDiv = document.getElementById(`${type}RemedyResults`);
            if (resultsDiv) {
                resultsDiv.style.display = 'none';
                resultsDiv.innerHTML = '';
            }
            
            // Re-enable remedy buttons
            const button = document.getElementById(`generate${type.charAt(0).toUpperCase() + type.slice(1)}Remedies`);
            if (button) {
                button.disabled = false;
                const loading = button.querySelector('.loading');
                if (loading) {
                    loading.style.display = 'none';
                }
            }

            // Clear stored remedies
            this.generatedRemedies[type] = null;
        });
    }

    validateForm(data) {
        const required = ['name', 'birthDate', 'birthPlace', 'entrance', 'masterBedroom', 'kitchen', 
                         'bathroom', 'poojaRoom', 'livingRoom', 'plotShape', 'houseNumber', 'houseDirection'];
        
        for (const field of required) {
            if (!data[field] || data[field].trim() === '') {
                alert(`Please fill in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`);
                return false;
            }
        }
        return true;
    }

    performComprehensiveAnalysis(formData) {
        // Store analysis data
        this.analysisData = {
            personalDetails: {
                name: formData.name,
                birthDate: formData.birthDate,
                birthTime: formData.birthTime,
                birthPlace: formData.birthPlace
            },
            propertyDetails: {
                entrance: formData.entrance,
                masterBedroom: formData.masterBedroom,
                kitchen: formData.kitchen,
                bathroom: formData.bathroom,
                poojaRoom: formData.poojaRoom,
                livingRoom: formData.livingRoom,
                plotShape: formData.plotShape,
                houseNumber: parseInt(formData.houseNumber),
                houseDirection: formData.houseDirection
            }
        };

        // Perform separate analyses
        this.vastuAnalysis = this.analyzeVastu();
        this.numerologyAnalysis = this.analyzeNumerology();
        this.astrologyAnalysis = this.analyzeAstrology();

        // Display results
        this.displayResults(this.vastuAnalysis, this.numerologyAnalysis, this.astrologyAnalysis);
    }

    // 1. VASTU ANALYSIS - Room directions + Plot shape only
    analyzeVastu() {
        const { propertyDetails } = this.analysisData;
        
        const roomScores = {
            'Entrance': this.getRoomScore('Entrance', propertyDetails.entrance),
            'Master Bedroom': this.getRoomScore('Master Bedroom', propertyDetails.masterBedroom),
            'Kitchen': this.getRoomScore('Kitchen', propertyDetails.kitchen),
            'Bathroom': this.getRoomScore('Bathroom', propertyDetails.bathroom),
            'Pooja Room': this.getRoomScore('Pooja Room', propertyDetails.poojaRoom),
            'Living Room': this.getRoomScore('Living Room', propertyDetails.livingRoom)
        };

        const avgRoomScore = Object.values(roomScores).reduce((a, b) => a + b, 0) / 6;
        const plotShapeScore = this.getPlotShapeScore(propertyDetails.plotShape);
        
        // Vastu score: 80% rooms + 20% plot shape
        const vastuScore = Math.round((avgRoomScore * 0.8) + (plotShapeScore * 0.2));

        return {
            score: vastuScore,
            roomScores,
            plotShapeScore,
            plotShape: propertyDetails.plotShape,
            interpretation: this.getScoreInterpretation(vastuScore)
        };
    }

    // 2. NUMEROLOGY ANALYSIS - House number compatibility
    analyzeNumerology() {
        const { personalDetails, propertyDetails } = this.analysisData;
        
        const birthNumber = this.calculateBirthNumber(personalDetails.birthDate);
        const houseNumber = propertyDetails.houseNumber;
        const houseNumerology = this.calculateHouseNumerology(houseNumber);
        
        const compatibility = this.checkNumerologyCompatibility(birthNumber, houseNumerology);
        
        return {
            score: compatibility.score,
            birthNumber,
            houseNumber,
            houseNumerology,
            compatibility: compatibility.status,
            interpretation: compatibility.interpretation
        };
    }

    // 3. ASTROLOGY ANALYSIS - House direction vs personal directions
    analyzeAstrology() {
        const { personalDetails, propertyDetails } = this.analysisData;
        
        const astrologyProfile = this.calculateAstrologyProfile(personalDetails);
        const houseDirection = propertyDetails.houseDirection;
        
        const directionCompatibility = this.checkDirectionCompatibility(
            astrologyProfile.favorableDirections,
            houseDirection
        );

        return {
            score: directionCompatibility.score,
            profile: astrologyProfile,
            houseDirection,
            compatibility: directionCompatibility.status,
            interpretation: directionCompatibility.interpretation
        };
    }

    // VASTU HELPER FUNCTIONS (keeping all existing methods)
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

    // NUMEROLOGY HELPER FUNCTIONS
    calculateBirthNumber(birthDate) {
        const date = new Date(birthDate);
        const dateStr = `${date.getDate()}${date.getMonth() + 1}${date.getFullYear()}`;
        let total = dateStr.split('').reduce((sum, digit) => sum + parseInt(digit), 0);
        while (total > 9 && total !== 11 && total !== 22 && total !== 33) {
            total = total.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
        }
        return total;
    }

    calculateHouseNumerology(houseNumber) {
        let total = houseNumber.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
        while (total > 9 && total !== 11 && total !== 22 && total !== 33) {
            total = total.toString().split('').reduce((sum, digit) => sum + parseInt(digit), 0);
        }
        return total;
    }

    checkNumerologyCompatibility(birthNum, houseNum) {
        const compatibility = {
            1: [1, 3, 5, 7, 9], 2: [2, 4, 6, 8], 3: [1, 3, 6, 9],
            4: [1, 2, 4, 7, 8], 5: [1, 5, 9], 6: [2, 3, 6, 9],
            7: [1, 4, 7], 8: [2, 4, 6, 8], 9: [1, 3, 5, 6, 9]
        };

        const isCompatible = compatibility[birthNum]?.includes(houseNum);
        
        return {
            score: isCompatible ? 90 : 45,
            status: isCompatible ? 'Excellent Match' : 'Needs Attention',
            interpretation: isCompatible ? 
                'Your house number is perfectly aligned with your birth energy.' :
                'Your house number may create energy conflicts. Remedies recommended.'
        };
    }

    // ASTROLOGY HELPER FUNCTIONS
    calculateAstrologyProfile(personalDetails) {
        const birthDate = new Date(personalDetails.birthDate);
        const dayOfWeek = birthDate.getDay();
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();
        
        const planetaryRuler = this.getPlanetaryRuler(dayOfWeek);
        const moonSign = this.getMoonSign(birthMonth, birthDay);
        const birthStar = this.getBirthStar(this.getDayOfYear(birthDate));
        const favorableDirections = this.getFavorableDirections(planetaryRuler, moonSign);
        
        return {
            planetaryRuler,
            moonSign,
            birthStar,
            favorableDirections
        };
    }

    getPlanetaryRuler(dayOfWeek) {
        const rulers = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
        return rulers[dayOfWeek];
    }

    getMoonSign(month, day) {
        const signs = ['Capricorn', 'Aquarius', 'Pisces', 'Aries', 'Taurus', 'Gemini',
                      'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius'];
        let signIndex = (month - 1 + Math.floor(day / 15)) % 12;
        return signs[signIndex];
    }

    getBirthStar(dayOfYear) {
        const nakshatras = ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 
                           'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni'];
        const index = Math.floor((dayOfYear * 27) / 365) % 27;
        return nakshatras[index % 11]; // Simplified for demo
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    getFavorableDirections(planetaryRuler, moonSign) {
        const planetaryDirections = {
            'Sun': ['East', 'Northeast'], 'Moon': ['Northwest', 'North'],
            'Mars': ['South', 'Southeast'], 'Mercury': ['North', 'Northeast'],
            'Jupiter': ['Northeast', 'East'], 'Venus': ['Southeast', 'South'],
            'Saturn': ['West', 'Southwest']
        };
        return planetaryDirections[planetaryRuler] || ['East', 'North'];
    }

    checkDirectionCompatibility(favorableDirections, houseDirection) {
        const isCompatible = favorableDirections.includes(houseDirection);
        
        return {
            score: isCompatible ? 95 : 40,
            status: isCompatible ? 'Perfect Alignment' : 'Conflicting Energy',
            interpretation: isCompatible ?
                'Your house direction perfectly matches your astrological profile.' :
                'Your house direction conflicts with your natural energy flow. Remedies needed.'
        };
    }

    getScoreInterpretation(score) {
        if (score >= 85) return { level: 'Excellent', desc: 'Outstanding alignment' };
        if (score >= 70) return { level: 'Good', desc: 'Generally favorable with minor improvements' };
        if (score >= 55) return { level: 'Average', desc: 'Moderate, remedies recommended' };
        return { level: 'Poor', desc: 'Significant issues, urgent remedies needed' };
    }

    // Helper function to get score color class
    getScoreColorClass(score) {
        return score > 80 ? 'score-good' : 'score-poor';
    }

    // DISPLAY FUNCTIONS
    displayResults(vastuAnalysis, numerologyAnalysis, astrologyAnalysis) {
        // Show results section
        document.getElementById('results').style.display = 'block';
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });

        // Display Vastu Analysis
        this.displayVastuResults(vastuAnalysis);
        
        // Display Numerology Analysis
        this.displayNumerologyResults(numerologyAnalysis);
        
        // Display Astrology Analysis
        this.displayAstrologyResults(astrologyAnalysis);
    }

    displayVastuResults(analysis) {
        document.getElementById('vastuScore').textContent = analysis.score;
        document.getElementById('vastuInterpretation').textContent = analysis.interpretation.level;
        document.getElementById('vastuDescription').textContent = analysis.interpretation.desc;

        const roomBreakdown = document.getElementById('vastuRoomBreakdown');
        roomBreakdown.innerHTML = '';
        
        // Add plot shape score first
        const plotElement = document.createElement('div');
        plotElement.className = `room-item ${this.getScoreClass(analysis.plotShapeScore)}`;
        plotElement.innerHTML = `
            <div class="room-name">Plot Shape (${analysis.plotShape})</div>
            <div class="room-score ${this.getScoreColorClass(analysis.plotShapeScore)}">${analysis.plotShapeScore}/100</div>
        `;
        roomBreakdown.appendChild(plotElement);
        
        // Add room scores
        Object.entries(analysis.roomScores).forEach(([room, score]) => {
            const roomElement = document.createElement('div');
            roomElement.className = `room-item ${this.getScoreClass(score)}`;
            roomElement.innerHTML = `
                <div class="room-name">${room}</div>
                <div class="room-score ${this.getScoreColorClass(score)}">${score}/100</div>
            `;
            roomBreakdown.appendChild(roomElement);
        });

        // Show/hide remedy button based on score
        const remedySection = document.querySelector('.vastu-section .remedy-section');
        if (analysis.score < 80) {
            remedySection.style.display = 'block';
        } else {
            remedySection.style.display = 'none';
        }
    }

    displayNumerologyResults(analysis) {
        document.getElementById('numerologyScore').textContent = analysis.score;
        document.getElementById('birthNumber').textContent = analysis.birthNumber;
        document.getElementById('displayHouseNumber').textContent = analysis.houseNumber;
        document.getElementById('houseNumerology').textContent = analysis.houseNumerology;
        document.getElementById('numerologyCompatibility').textContent = analysis.compatibility;
        document.getElementById('numerologyCompatibility').className = 
            analysis.score >= 70 ? 'compatible' : 'incompatible';
    }

    displayAstrologyResults(analysis) {
        document.getElementById('astrologyScore').textContent = analysis.score;
        document.getElementById('planetaryRuler').textContent = analysis.profile.planetaryRuler;
        document.getElementById('moonSign').textContent = analysis.profile.moonSign;
        document.getElementById('birthStar').textContent = analysis.profile.birthStar;

        // Display favorable directions
        const favorableDiv = document.getElementById('favorableDirections');
        favorableDiv.innerHTML = analysis.profile.favorableDirections
            .map(dir => `<span class="direction-badge favorable">${dir}</span>`).join('');

        // Display house direction
        const houseDir = document.getElementById('currentHouseDirection');
        houseDir.innerHTML = `<span class="direction-badge current">${analysis.houseDirection}</span>`;

        // Display compatibility
        const compatibility = document.getElementById('directionCompatibility');
        compatibility.textContent = analysis.compatibility;
        compatibility.className = analysis.score >= 70 ? 'compatible' : 'incompatible';
    }

    getScoreClass(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 55) return 'average';
        return 'poor';
    }

    // REMEDY GENERATION
    async generateRemedies(analysisType) {
        const button = document.getElementById(`generate${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}Remedies`);
        const resultsDiv = document.getElementById(`${analysisType}RemedyResults`);
        const loading = button.querySelector('.loading');

        try {
            button.disabled = true;
            loading.style.display = 'inline';
            
            // Show loading
            resultsDiv.innerHTML = `
                <div class="remedy-loading">
                    <div class="spinner"></div>
                    <p>Generating personalized ${analysisType} remedies...</p>
                </div>
            `;
            resultsDiv.style.display = 'block';

            const response = await fetch(`${this.apiBaseUrl}/generate-remedies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    analysisType,
                    personalDetails: this.analysisData.personalDetails,
                    propertyDetails: this.analysisData.propertyDetails
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const result = await response.json();
            
            // Store remedies for PDF generation
            this.generatedRemedies[analysisType] = result.remedies;
            
            this.displayRemedies(analysisType, result.remedies);

        } catch (error) {
            console.error('Failed to generate remedies:', error);
            this.showRemedyError(analysisType, error.message);
        } finally {
            button.disabled = false;
            loading.style.display = 'none';
        }
    }

    displayRemedies(analysisType, remedies) {
        const resultsDiv = document.getElementById(`${analysisType}RemedyResults`);
        
        let content = remedies.content || 'No content received';
        
        // Clean up escaped characters
        content = content
            .replace(/\\n/g, '\n')
            .replace(/\\\*/g, '')
            .replace(/\*\*/g, '')
            .replace(/\\"/g, '"');

        // Parse numbered remedies
        const remedyList = this.parseRemedies(content);

        const typeLabels = {
            vastu: 'Vastu Shastra',
            numerology: 'Numerology',
            astrology: 'Astrological'
        };

        const typeIcons = {
            vastu: '🏠',
            numerology: '🔢',
            astrology: '⭐'
        };

        resultsDiv.innerHTML = `
            <div class="remedy-content">
                <div class="remedy-header">
                    <h4>${typeIcons[analysisType]} ${typeLabels[analysisType]} Remedies</h4>
                    <p class="remedy-subtitle">Practical solutions to improve your ${analysisType} alignment</p>
                </div>
                <div class="remedy-list">
                    ${remedyList.map((remedy, index) => `
                        <div class="remedy-item">
                            <div class="remedy-number">${index + 1}</div>
                            <div class="remedy-text">${remedy}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="remedy-meta">
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
        `;
    }

    parseRemedies(content) {
        // Split by lines and filter for numbered remedies
        const lines = content.split('\n').filter(line => line.trim());
        const remedies = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Look for numbered items (1., 2., etc.) or bullet points
            if (trimmedLine.match(/^\d+\./) || trimmedLine.match(/^[-•*]/) || 
                (trimmedLine.length > 20 && !trimmedLine.includes(':'))) {
                let remedy = trimmedLine
                    .replace(/^\d+\.\s*/, '') // Remove numbering
                    .replace(/^[-•*]\s*/, '') // Remove bullet points
                    .trim();
                
                if (remedy.length > 10) {
                    remedies.push(remedy);
                }
            }
        }
        
        // If no numbered remedies found, split by sentences
        if (remedies.length === 0) {
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
            return sentences.slice(0, 7); // Max 7 remedies
        }
        
        return remedies.slice(0, 7); // Max 7 remedies
    }

    showRemedyError(analysisType, message) {
        const resultsDiv = document.getElementById(`${analysisType}RemedyResults`);
        resultsDiv.innerHTML = `
            <div class="remedy-error">
                <h4>❌ Unable to Generate Remedies</h4>
                <p>${message}</p>
            </div>
        `;
    }

    // PDF GENERATION FUNCTION
    async downloadPDFReport() {
        const button = document.getElementById('downloadReport');
        const loading = button.querySelector('.download-loading');

        try {
            button.disabled = true;
            loading.style.display = 'inline';

            // Check if jsPDF is available
            if (typeof window.jsPDF === 'undefined') {
                throw new Error('PDF library not loaded');
            }

            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();

            // Set initial position
            let yPosition = 20;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;

            // Helper function to check if we need a new page
            const checkNewPage = (requiredSpace = 20) => {
                if (yPosition + requiredSpace > pageHeight - margin) {
                    doc.addPage();
                    yPosition = 20;
                }
            };

            // Title
            doc.setFontSize(20);
            doc.setFont(undefined, 'bold');
            doc.text('Complete Vastu-Astrology-Numerology Report', margin, yPosition);
            yPosition += 15;

            // Personal Details
            doc.setFontSize(14);
            doc.text('Personal Information', margin, yPosition);
            yPosition += 10;
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            doc.text(`Name: ${this.analysisData.personalDetails.name}`, margin, yPosition);
            yPosition += 7;
            doc.text(`Birth Date: ${this.analysisData.personalDetails.birthDate}`, margin, yPosition);
            yPosition += 7;
            doc.text(`Birth Place: ${this.analysisData.personalDetails.birthPlace}`, margin, yPosition);
            yPosition += 7;
            doc.text(`House Number: ${this.analysisData.propertyDetails.houseNumber}`, margin, yPosition);
            yPosition += 7;
            doc.text(`House Direction: ${this.analysisData.propertyDetails.houseDirection}`, margin, yPosition);
            yPosition += 15;

            checkNewPage(30);

            // Vastu Analysis
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('🏠 Vastu Analysis', margin, yPosition);
            yPosition += 10;

            doc.setFontSize(12);
            doc.text(`Score: ${this.vastuAnalysis.score}/100 - ${this.vastuAnalysis.interpretation.level}`, margin, yPosition);
            yPosition += 7;
            doc.setFontSize(10);
            doc.text(`${this.vastuAnalysis.interpretation.desc}`, margin, yPosition);
            yPosition += 10;

            // Room Scores
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text('Room Scores:', margin, yPosition);
            yPosition += 7;
            doc.setFont(undefined, 'normal');
            
            doc.text(`Plot Shape (${this.vastuAnalysis.plotShape}): ${this.vastuAnalysis.plotShapeScore}/100`, margin, yPosition);
            yPosition += 6;
            
            Object.entries(this.vastuAnalysis.roomScores).forEach(([room, score]) => {
                checkNewPage(8);
                doc.text(`${room}: ${score}/100`, margin, yPosition);
                yPosition += 6;
            });
            yPosition += 10;

            // Vastu Remedies
            if (this.generatedRemedies.vastu) {
                checkNewPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('Vastu Remedies:', margin, yPosition);
                yPosition += 7;
                doc.setFont(undefined, 'normal');
                
                const vastuRemedyList = this.parseRemedies(this.generatedRemedies.vastu.content);
                vastuRemedyList.forEach((remedy, index) => {
                    checkNewPage(12);
                    const remedyText = `${index + 1}. ${remedy}`;
                    const lines = doc.splitTextToSize(remedyText, 170);
                    doc.text(lines, margin, yPosition);
                    yPosition += lines.length * 5 + 3;
                });
            }
            yPosition += 10;

            checkNewPage(30);

            // Numerology Analysis
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('🔢 Numerology Analysis', margin, yPosition);
            yPosition += 10;

            doc.setFontSize(12);
            doc.text(`Score: ${this.numerologyAnalysis.score}/100 - ${this.numerologyAnalysis.compatibility}`, margin, yPosition);
            yPosition += 7;
            doc.setFontSize(10);
            doc.text(`Birth Number: ${this.numerologyAnalysis.birthNumber}`, margin, yPosition);
            yPosition += 6;
            doc.text(`House Numerology: ${this.numerologyAnalysis.houseNumerology}`, margin, yPosition);
            yPosition += 6;
            doc.text(`${this.numerologyAnalysis.interpretation}`, margin, yPosition);
            yPosition += 10;

            // Numerology Remedies
            if (this.generatedRemedies.numerology) {
                checkNewPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('Numerology Remedies:', margin, yPosition);
                yPosition += 7;
                doc.setFont(undefined, 'normal');
                
                const numerologyRemedyList = this.parseRemedies(this.generatedRemedies.numerology.content);
                numerologyRemedyList.forEach((remedy, index) => {
                    checkNewPage(12);
                    const remedyText = `${index + 1}. ${remedy}`;
                    const lines = doc.splitTextToSize(remedyText, 170);
                    doc.text(lines, margin, yPosition);
                    yPosition += lines.length * 5 + 3;
                });
            }
            yPosition += 10;

            checkNewPage(30);

            // Astrology Analysis
            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            doc.text('⭐ Astrology Analysis', margin, yPosition);
            yPosition += 10;

            doc.setFontSize(12);
            doc.text(`Score: ${this.astrologyAnalysis.score}/100 - ${this.astrologyAnalysis.compatibility}`, margin, yPosition);
            yPosition += 7;
            doc.setFontSize(10);
            doc.text(`Planetary Ruler: ${this.astrologyAnalysis.profile.planetaryRuler}`, margin, yPosition);
            yPosition += 6;
            doc.text(`Moon Sign: ${this.astrologyAnalysis.profile.moonSign}`, margin, yPosition);
            yPosition += 6;
            doc.text(`Birth Star: ${this.astrologyAnalysis.profile.birthStar}`, margin, yPosition);
            yPosition += 6;
            doc.text(`Favorable Directions: ${this.astrologyAnalysis.profile.favorableDirections.join(', ')}`, margin, yPosition);
            yPosition += 6;
            doc.text(`${this.astrologyAnalysis.interpretation}`, margin, yPosition);
            yPosition += 10;

            // Astrology Remedies
            if (this.generatedRemedies.astrology) {
                checkNewPage(20);
                doc.setFont(undefined, 'bold');
                doc.text('Astrological Remedies:', margin, yPosition);
                yPosition += 7;
                doc.setFont(undefined, 'normal');
                
                const astrologyRemedyList = this.parseRemedies(this.generatedRemedies.astrology.content);
                astrologyRemedyList.forEach((remedy, index) => {
                    checkNewPage(12);
                    const remedyText = `${index + 1}. ${remedy}`;
                    const lines = doc.splitTextToSize(remedyText, 170);
                    doc.text(lines, margin, yPosition);
                    yPosition += lines.length * 5 + 3;
                });
            }

            // Footer
            checkNewPage(15);
            doc.setFontSize(9);
            doc.text(`Report generated on: ${new Date().toLocaleString()}`, margin, yPosition);

            // Save the PDF
            const fileName = `Complete_Analysis_Report_${this.analysisData.personalDetails.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF report. Please try again.');
        } finally {
            button.disabled = false;
            loading.style.display = 'none';
        }
    }
}

// Initialize the calculator
const calculator = new ComprehensiveVastuCalculator();
