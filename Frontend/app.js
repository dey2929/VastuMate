class ComprehensiveVastuCalculator {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3001/api';
        this.analysisData = null;
        // Store analysis results
        this.vastuAnalysis = null;
        this.numerologyAnalysis = null;
        this.astrologyAnalysis = null;
        // Store remedies
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

        // PDF Download button - now captures the page
        document.getElementById('downloadReport')?.addEventListener('click', () => 
            this.downloadPageAsPDF());
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

    // All existing analysis methods remain the same...
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
        
        const vastuScore = Math.round((avgRoomScore * 0.8) + (plotShapeScore * 0.2));

        return {
            score: vastuScore,
            roomScores,
            plotShapeScore,
            plotShape: propertyDetails.plotShape,
            interpretation: this.getScoreInterpretation(vastuScore)
        };
    }

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

    // All existing helper methods remain the same...
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
        return nakshatras[index % 11];
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

    getScoreColorClass(score) {
        return score > 80 ? 'score-good' : 'score-poor';
    }

    // All existing display and remedy methods remain the same...
    displayResults(vastuAnalysis, numerologyAnalysis, astrologyAnalysis) {
        document.getElementById('results').style.display = 'block';
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });

        this.displayVastuResults(vastuAnalysis);
        this.displayNumerologyResults(numerologyAnalysis);
        this.displayAstrologyResults(astrologyAnalysis);
    }

    displayVastuResults(analysis) {
        document.getElementById('vastuScore').textContent = analysis.score;
        document.getElementById('vastuInterpretation').textContent = analysis.interpretation.level;
        document.getElementById('vastuDescription').textContent = analysis.interpretation.desc;

        const roomBreakdown = document.getElementById('vastuRoomBreakdown');
        roomBreakdown.innerHTML = '';
        
        const plotElement = document.createElement('div');
        plotElement.className = `room-item ${this.getScoreClass(analysis.plotShapeScore)}`;
        plotElement.innerHTML = `
            <div class="room-name">Plot Shape (${analysis.plotShape})</div>
            <div class="room-score ${this.getScoreColorClass(analysis.plotShapeScore)}">${analysis.plotShapeScore}/100</div>
        `;
        roomBreakdown.appendChild(plotElement);
        
        Object.entries(analysis.roomScores).forEach(([room, score]) => {
            const roomElement = document.createElement('div');
            roomElement.className = `room-item ${this.getScoreClass(score)}`;
            roomElement.innerHTML = `
                <div class="room-name">${room}</div>
                <div class="room-score ${this.getScoreColorClass(score)}">${score}/100</div>
            `;
            roomBreakdown.appendChild(roomElement);
        });

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

        const favorableDiv = document.getElementById('favorableDirections');
        favorableDiv.innerHTML = analysis.profile.favorableDirections
            .map(dir => `<span class="direction-badge favorable">${dir}</span>`).join('');

        const houseDir = document.getElementById('currentHouseDirection');
        houseDir.innerHTML = `<span class="direction-badge current">${analysis.houseDirection}</span>`;

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

    // All existing remedy methods remain the same...
    async generateRemedies(analysisType) {
        const button = document.getElementById(`generate${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}Remedies`);
        const resultsDiv = document.getElementById(`${analysisType}RemedyResults`);
        const loading = button.querySelector('.loading');

        try {
            button.disabled = true;
            loading.style.display = 'inline';
            
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
        
        content = content
            .replace(/\\n/g, '\n')
            .replace(/\\\*/g, '')
            .replace(/\*\*/g, '')
            .replace(/\\"/g, '"');

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
                <p>Generated on: ${new Date().toLocaleString()}, Model: GPT-4o</p>
            </div>
        `;
    }

    parseRemedies(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const remedies = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.match(/^\d+\./) || trimmedLine.match(/^[-•*]/) || 
                (trimmedLine.length > 20 && !trimmedLine.includes(':'))) {
                let remedy = trimmedLine
                    .replace(/^\d+\.\s*/, '')
                    .replace(/^[-•*]\s*/, '')
                    .trim();
                
                if (remedy.length > 10) {
                    remedies.push(remedy);
                }
            }
        }
        
        if (remedies.length === 0) {
            const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
            return sentences.slice(0, 7);
        }
        
        return remedies.slice(0, 7);
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

    // NEW METHOD: CAPTURE PAGE AS PDF
    async downloadPageAsPDF() {
        const button = document.getElementById('downloadReport');
        const loading = button.querySelector('.download-loading');

        try {
            button.disabled = true;
            loading.style.display = 'inline';

            // Check if analysis is complete
            if (!this.analysisData || !this.vastuAnalysis || !this.numerologyAnalysis || !this.astrologyAnalysis) {
                throw new Error('Please complete the property analysis first');
            }

            // Check if required libraries are loaded
            if (typeof html2canvas === 'undefined' || typeof window.jsPDF === 'undefined') {
                throw new Error('PDF libraries not loaded. Please refresh the page and try again.');
            }

            // Temporarily hide the download section to avoid capturing it
            const downloadSection = document.querySelector('.download-section');
            const originalDisplay = downloadSection.style.display;
            downloadSection.style.display = 'none';

            // Scroll to top to ensure full capture
            window.scrollTo(0, 0);

            // Wait a moment for scroll to complete
            await new Promise(resolve => setTimeout(resolve, 500));

            // Capture the page
            const canvas = await html2canvas(document.body, {
                height: window.innerHeight,
                width: window.innerWidth,
                useCORS: true,
                scale: 1,
                scrollX: 0,
                scrollY: 0,
                allowTaint: true,
                backgroundColor: '#f3f4f6',
                ignoreElements: (element) => {
                    // Ignore loading spinners and other temporary elements
                    return element.classList.contains('spinner') || 
                           element.classList.contains('loading') ||
                           element.style.display === 'none';
                }
            });

            // Restore download section
            downloadSection.style.display = originalDisplay;

            // Create PDF
            const { jsPDF } = window.jsPDF;
            const imgData = canvas.toDataURL('image/png');
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 295; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if content is longer than one page
            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Save the PDF
            const fileName = `Vastu_Analysis_Report_${this.analysisData.personalDetails.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            alert('PDF report downloaded successfully!');

        } catch (error) {
            console.error('Failed to capture page as PDF:', error);
            alert(`Failed to generate PDF: ${error.message}`);
        } finally {
            button.disabled = false;
            loading.style.display = 'none';
        }
    }
}

// Initialize the calculator
const calculator = new ComprehensiveVastuCalculator();
