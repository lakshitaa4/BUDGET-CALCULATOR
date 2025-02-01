class TaxCalculator {
  constructor() {
      this.form = document.getElementById('taxForm');
      this.resultsDiv = document.getElementById('results');
      this.taxBreakdownDiv = document.querySelector('.tax-breakdown');
      this.savingsHighlightDiv = document.querySelector('.savings-highlight');
      this.chart = null;

      // Initialize event listeners for real-time calculation
      this.initializeEventListeners();
  }

  initializeEventListeners() {
      // Listen to changes in the form inputs for real-time tax calculation
      document.getElementById('income').addEventListener('input', () => this.calculateTax());
      document.getElementById('section80C').addEventListener('input', () => this.calculateTax());
      document.getElementById('hra').addEventListener('input', () => this.calculateTax());
      document.getElementById('age').addEventListener('change', () => this.calculateTax());
  }

  calculateTax() {
      const income = parseFloat(document.getElementById('income').value) || 0;
      const age = document.getElementById('age').value;
      const section80C = parseFloat(document.getElementById('section80C').value) || 0;
      const hra = parseFloat(document.getElementById('hra').value) || 0;

      const taxableIncome = this.calculateTaxableIncome(income, section80C, hra);
      const oldTax = this.calculateOldRegimeTax(taxableIncome, age);
      const newTax = this.calculateNewRegimeTax(income);
      const savings = oldTax - newTax;

      this.displayResults(income, taxableIncome, oldTax, newTax, savings);
      this.createChart(oldTax, newTax);
  }

  calculateTaxableIncome(income, section80C, hra) {
      let deductions = Math.min(section80C, 150000) + hra;
      return Math.max(0, income - deductions);
  }

  calculateOldRegimeTax(income, age) {
      let tax = 0;
      let taxableIncome = income;

      // Standard deduction
      taxableIncome -= 50000;

      const slabs = this.getOldRegimeSlabs(age);
      
      for (const slab of slabs) {
          if (taxableIncome > slab.limit) {
              const taxableAmount = Math.min(taxableIncome - slab.limit, slab.width || Infinity);
              tax += taxableAmount * slab.rate;
          }
      }

      // Add health and education cess
      tax += tax * 0.04;

      return Math.max(0, tax);
  }

  calculateNewRegimeTax(income) {
      let tax = 0;

      // New tax regime slabs for 2025
      const slabs = [
          { limit: 0, width: 400000, rate: 0 },
          { limit: 400000, width: 400000, rate: 0.05 },
          { limit: 800000, width: 400000, rate: 0.10 },
          { limit: 1200000, width: 400000, rate: 0.15 },
          { limit: 1600000, width: 400000, rate: 0.20 },
          { limit: 2000000, width: 400000, rate: 0.25 },
          { limit: 2400000, rate: 0.30 }
      ];

      // Apply tax rebate for income up to ₹12 Lakhs
      if (income <= 1200000) {
          return 0;
      }

      for (const slab of slabs) {
          if (income > slab.limit) {
              const taxableAmount = Math.min(income - slab.limit, slab.width || Infinity);
              tax += taxableAmount * slab.rate;
          }
      }

      // Add health and education cess
      tax += tax * 0.04;

      return tax;
  }

  getOldRegimeSlabs(age) {
      const generalSlabs = [
          { limit: 0, width: 250000, rate: 0 },
          { limit: 250000, width: 250000, rate: 0.05 },
          { limit: 500000, width: 500000, rate: 0.20 },
          { limit: 1000000, rate: 0.30 }
      ];

      const seniorSlabs = [
          { limit: 0, width: 300000, rate: 0 },
          { limit: 300000, width: 200000, rate: 0.05 },
          { limit: 500000, width: 500000, rate: 0.20 },
          { limit: 1000000, rate: 0.30 }
      ];

      const superSeniorSlabs = [
          { limit: 0, width: 500000, rate: 0 },
          { limit: 500000, width: 500000, rate: 0.20 },
          { limit: 1000000, rate: 0.30 }
      ];

      switch (age) {
          case 'senior': return seniorSlabs;
          case 'super-senior': return superSeniorSlabs;
          default: return generalSlabs;
      }
  }

  displayResults(income, taxableIncome, oldTax, newTax, savings) {
      this.resultsDiv.classList.remove('hidden');

      const formatter = new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
      });

      this.taxBreakdownDiv.innerHTML = `
          <div class="result-item">
              <h3>Income Details</h3>
              <p>Gross Income: ${formatter.format(income)}</p>
              <p>Taxable Income: ${formatter.format(taxableIncome)}</p>
          </div>
          <div class="result-item">
              <h3>Tax Computation</h3>
              <p>Old Regime Tax: ${formatter.format(oldTax)}</p>
              <p>New Regime Tax: ${formatter.format(newTax)}</p>
              <p>Effective Tax Rate (New): ${((newTax / income) * 100).toFixed(2)}%</p>
          </div>`;

      const savingsText = savings > 0 
          ? `You save ${formatter.format(savings)} under the new tax regime!`
          : `You save ${formatter.format(-savings)} under the old tax regime!`;

      this.savingsHighlightDiv.innerHTML = `
          <h3>Tax Savings Analysis</h3>
          <p>${savingsText}</p>
          <p>Recommended Regime: <strong>${savings > 0 ? 'New' : 'Old'}</strong></p>`;
  }

  createChart(oldTax, newTax) {
      if (this.chart) {
          this.chart.destroy();
      }

      const ctx = document.getElementById('taxChart').getContext('2d');
      this.chart = new Chart(ctx, {
          type: 'bar',
          data: {
              labels: ['Old Regime', 'New Regime'],
              datasets: [{
                  label: 'Tax Amount (₹)',
                  data: [oldTax, newTax],
                  backgroundColor: [
                      'rgba(37, 99, 235, 0.7)',
                      'rgba(5, 150, 105, 0.7)'
                  ],
                  borderColor: [
                      'rgba(37, 99, 235, 1)',
                      'rgba(5, 150, 105, 1)'
                  ],
                  borderWidth: 1
              }]
          },
          options: {
              responsive: true,
              plugins: {
                  legend: {
                      display: false
                  },
                  tooltip: {
                      callbacks: {
                          label: function(context) {
                              return new Intl.NumberFormat('en-IN', {
                                  style: 'currency',
                                  currency: 'INR',
                                  maximumFractionDigits: 0
                              }).format(context.raw);
                          }
                      }
                  }
              },
              scales: {
                  y: {
                      beginAtZero: true,
                      ticks: {
                          callback: function(value) {
                              return '₹' + value.toLocaleString('en-IN');
                          }
                      }
                  }
              }
          }
      });
  }
}


// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TaxCalculator();
});
let lastScrollTop = 0; // Keeps track of the last scroll position
const navbar = document.querySelector('.navbar'); // Get the navbar element

window.addEventListener('scroll', function () {
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop; // Get current scroll position

    // If we're scrolling down and the scroll position is greater than 50px
    if (currentScroll > lastScrollTop && currentScroll > 50) {
        navbar.style.top = "-60px"; // Hide the navbar (adjust height if needed)
    } else {
        navbar.style.top = "0"; // Show the navbar
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // Avoid negative scroll positions
});
