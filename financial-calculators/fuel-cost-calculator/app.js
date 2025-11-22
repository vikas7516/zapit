class FuelCalculator {
    constructor() {
        this.fuelPrices = {
            petrol: 95,
            diesel: 88,
            cng: 75,
            electric: 6 // per kWh, converted to equivalent
        };
        
        this.efficiencyRanges = {
            car: { petrol: 15, diesel: 20, cng: 18, electric: 120 },
            motorcycle: { petrol: 45, diesel: 60, cng: 40, electric: 80 },
            scooter: { petrol: 50, diesel: 65, cng: 45, electric: 90 },
            suv: { petrol: 12, diesel: 16, cng: 14, electric: 100 },
            truck: { petrol: 8, diesel: 12, cng: 10, electric: 80 }
        };
        
        this.initializeEventListeners();
        this.calculate();
    }

    initializeEventListeners() {
        // Input change listeners
        const inputs = [
            'fuelEfficiency', 'fuelType', 'fuelPrice', 'vehicleType',
            'distance', 'tripType', 'passengers', 'tollCharges', 'parkingCharges'
        ];

        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', () => this.calculate());
                element.addEventListener('change', () => this.calculate());
            }
        });

        // Fuel type buttons
        document.querySelectorAll('.fuel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const fuelType = e.target.dataset.fuel;
                this.setFuelType(fuelType);
            });
        });

        // Vehicle type change
        document.getElementById('vehicleType').addEventListener('change', () => {
            this.updateEfficiencyForVehicle();
        });
    }

    setFuelType(fuelType) {
        document.getElementById('fuelType').value = fuelType;
        
        // Update active button
        document.querySelectorAll('.fuel-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-fuel="${fuelType}"]`).classList.add('active');
        
        // Update fuel price and unit
        document.getElementById('fuelPrice').value = this.fuelPrices[fuelType];
        const priceUnit = document.getElementById('priceUnit');
        priceUnit.textContent = fuelType === 'electric' ? '/kWh' : '/liter';
        
        // Update efficiency for vehicle type
        this.updateEfficiencyForVehicle();
        this.calculate();
    }

    updateEfficiencyForVehicle() {
        const vehicleType = document.getElementById('vehicleType').value;
        const fuelType = document.getElementById('fuelType').value;
        const defaultEfficiency = this.efficiencyRanges[vehicleType]?.[fuelType] || 15;
        
        document.getElementById('fuelEfficiency').value = defaultEfficiency;
    }

    calculate() {
        const data = this.getInputData();
        const calculations = this.performCalculations(data);
        
        this.updateResults(calculations);
        this.updateFuelComparison(data);
        this.updateProjections(calculations);
    }

    getInputData() {
        const tripType = document.getElementById('tripType').value;
        const baseDistance = parseFloat(document.getElementById('distance').value) || 0;
        const distance = tripType === 'round-trip' ? baseDistance * 2 : baseDistance;
        
        return {
            fuelEfficiency: parseFloat(document.getElementById('fuelEfficiency').value) || 15,
            fuelType: document.getElementById('fuelType').value,
            fuelPrice: parseFloat(document.getElementById('fuelPrice').value) || 95,
            vehicleType: document.getElementById('vehicleType').value,
            distance: distance,
            baseDistance: baseDistance,
            tripType: tripType,
            passengers: parseInt(document.getElementById('passengers').value) || 1,
            tollCharges: parseFloat(document.getElementById('tollCharges').value) || 0,
            parkingCharges: parseFloat(document.getElementById('parkingCharges').value) || 0
        };
    }

    performCalculations(data) {
        // Calculate fuel required
        let fuelRequired;
        if (data.fuelType === 'electric') {
            // For electric vehicles, efficiency is in km/kWh
            fuelRequired = data.distance / data.fuelEfficiency;
        } else {
            // For other fuels, efficiency is in km/liter
            fuelRequired = data.distance / data.fuelEfficiency;
        }
        
        // Calculate fuel cost
        const fuelCost = fuelRequired * data.fuelPrice;
        
        // Calculate total trip cost
        const totalCost = fuelCost + data.tollCharges + data.parkingCharges;
        
        // Calculate cost per person
        const costPerPerson = totalCost / data.passengers;
        
        // Calculate cost per km
        const costPerKm = totalCost / data.distance;
        
        // Calculate recurring costs
        const dailyCost = data.tripType === 'round-trip' ? totalCost : totalCost * 2;
        const weeklyCost = dailyCost * 7;
        const monthlyCost = dailyCost * 30;
        const yearlyCost = dailyCost * 365;
        
        return {
            fuelRequired,
            fuelCost,
            totalCost,
            costPerPerson,
            costPerKm,
            dailyCost,
            weeklyCost,
            monthlyCost,
            yearlyCost
        };
    }

    updateResults(calculations) {
        const fuelType = document.getElementById('fuelType').value;
        const unit = fuelType === 'electric' ? 'kWh' : 'L';
        
        document.getElementById('fuelRequired').textContent = 
            `${calculations.fuelRequired.toFixed(2)}${unit}`;
        document.getElementById('fuelCost').textContent = 
            this.formatCurrency(calculations.fuelCost);
        document.getElementById('totalCost').textContent = 
            this.formatCurrency(calculations.totalCost);
        document.getElementById('costPerPerson').textContent = 
            this.formatCurrency(calculations.costPerPerson);
        document.getElementById('costPerKm').textContent = 
            this.formatCurrency(calculations.costPerKm);
        
        // Update recurring costs
        document.getElementById('dailyCost').textContent = 
            this.formatCurrency(calculations.dailyCost);
        document.getElementById('weeklyCost').textContent = 
            this.formatCurrency(calculations.weeklyCost);
        document.getElementById('monthlyCost').textContent = 
            this.formatCurrency(calculations.monthlyCost);
        document.getElementById('yearlyCost').textContent = 
            this.formatCurrency(calculations.yearlyCost);
    }

    updateFuelComparison(data) {
        const container = document.getElementById('fuelComparison');
        container.innerHTML = '';
        
        const fuelTypes = ['petrol', 'diesel', 'cng', 'electric'];
        const vehicleType = data.vehicleType;
        
        fuelTypes.forEach(fuelType => {
            const efficiency = this.efficiencyRanges[vehicleType]?.[fuelType] || 15;
            const price = this.fuelPrices[fuelType];
            
            let fuelRequired;
            if (fuelType === 'electric') {
                fuelRequired = data.distance / efficiency;
            } else {
                fuelRequired = data.distance / efficiency;
            }
            
            const fuelCost = fuelRequired * price;
            const totalCost = fuelCost + data.tollCharges + data.parkingCharges;
            const costPerKm = totalCost / data.distance;
            const yearlyCost = totalCost * 365; // Assuming daily usage
            
            const unit = fuelType === 'electric' ? 'kWh' : 'L';
            const priceUnit = fuelType === 'electric' ? '/kWh' : '/L';
            
            const comparisonCard = document.createElement('div');
            comparisonCard.className = 'comparison-card';
            comparisonCard.innerHTML = `
                <div class="comparison-title">${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)}</div>
                <div class="comparison-metric">
                    <span class="metric-label">Efficiency</span>
                    <span class="metric-value">${efficiency} km/${unit.toLowerCase()}</span>
                </div>
                <div class="comparison-metric">
                    <span class="metric-label">Fuel Price</span>
                    <span class="metric-value">₹${price}${priceUnit}</span>
                </div>
                <div class="comparison-metric">
                    <span class="metric-label">Fuel Required</span>
                    <span class="metric-value">${fuelRequired.toFixed(2)} ${unit}</span>
                </div>
                <div class="comparison-metric">
                    <span class="metric-label">Cost per km</span>
                    <span class="metric-value">${this.formatCurrency(costPerKm)}</span>
                </div>
                <div class="comparison-metric">
                    <span class="metric-label">Trip Cost</span>
                    <span class="metric-value">${this.formatCurrency(totalCost)}</span>
                </div>
            `;
            
            container.appendChild(comparisonCard);
        });
    }

    updateProjections(calculations) {
        const currentYearCost = calculations.yearlyCost;
        const inflationRate = 0.05; // 5% annual inflation
        
        // Calculate inflated cost
        const inflatedCost = currentYearCost * (1 + inflationRate);
        
        // Calculate 5-year total with compound inflation
        let fiveYearTotal = 0;
        for (let year = 1; year <= 5; year++) {
            fiveYearTotal += currentYearCost * Math.pow(1 + inflationRate, year - 1);
        }
        
        // Calculate potential savings with 20% better efficiency
        const efficientYearlyCost = calculations.yearlyCost * 0.8;
        const potentialSavings = currentYearCost - efficientYearlyCost;
        
        document.getElementById('currentYearCost').textContent = 
            this.formatCurrency(currentYearCost);
        document.getElementById('inflatedCost').textContent = 
            this.formatCurrency(inflatedCost);
        document.getElementById('fiveYearCost').textContent = 
            this.formatCurrency(fiveYearTotal);
        document.getElementById('potentialSavings').textContent = 
            this.formatCurrency(potentialSavings);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FuelCalculator();
});