(function() {
    // --- Helper Functions for Arithmetic using BigInt ---
  
    // Euclid's algorithm for gcd
    function gcd(a, b) {
      a = BigInt(a);
      b = BigInt(b);
      while (b !== 0n) {
        let temp = b;
        b = a % b;
        a = temp;
      }
      return a;
    }
  
    // Check if n is a perfect power: n = a^b for some a > 1, b > 1.
    function isPerfectPower(n) {
      n = BigInt(n);
      for (let b = 2n; b <= 64n; b++) {
        let low = 2n, high = n;
        while (low <= high) {
          let mid = (low + high) / 2n;
          let power = mid ** b;
          if (power === n) return true;
          else if (power < n) low = mid + 1n;
          else high = mid - 1n;
        }
      }
      return false;
    }
  
    // Multiplicative order of n modulo r.
    function multiplicativeOrder(n, r) {
      n = BigInt(n);
      r = BigInt(r);
      let k = 1n;
      let current = n % r;
      while (current !== 1n && k < r) {
        current = (current * n) % r;
        k++;
      }
      return k;
    }
  
    // Find smallest r such that gcd(n, r) = 1 and order(n, r) > (log2 n)^2.
    function findSmallestR(n) {
      n = BigInt(n);
      let log2n = Math.log2(Number(n));
      let threshold = BigInt(Math.floor(log2n * log2n));
      let r = 2n;
      while (true) {
        if (gcd(n, r) === 1n) {
          let order = multiplicativeOrder(n, r);
          if (order > threshold) {
            return r;
          }
        }
        r++;
      }
    }
  
    // --- Polynomial Arithmetic ---
    function polyMult(poly1, poly2, n, r) {
      let result = new Array(Number(r)).fill(0n);
      for (let i = 0; i < poly1.length; i++) {
        for (let j = 0; j < poly2.length; j++) {
          let deg = (i + j) % Number(r);
          result[deg] = (result[deg] + poly1[i] * poly2[j]) % n;
        }
      }
      return result;
    }
  
    function polyPow(poly, exp, n, r) {
      let result = [1n];
      let base = poly.slice();
      while (exp > 0n) {
        if (exp % 2n === 1n) {
          result = polyMult(result, base, n, r);
        }
        base = polyMult(base, base, n, r);
        exp = exp / 2n;
      }
      while (result.length < Number(r)) {
        result.push(0n);
      }
      return result;
    }
  
    function polyEqual(poly1, poly2, n, r) {
      for (let i = 0; i < Number(r); i++) {
        if ((poly1[i] || 0n) % n !== (poly2[i] || 0n) % n) return false;
      }
      return true;
    }
  
    // --- Prime Algorithm with Detailed Trace ---
    // Returns an object: { result: "PRIME"/"COMPOSITE", trace: { step: message, ... }, polyCoeffs: [coefficients] }
    function primeAlgorithmWithTrace(input) {
      let trace = {};
      trace["Input"] = "Input number: " + input;
      let n = BigInt(input);
  
      if (n < 2n) {
        trace["Validation"] = "Number is less than 2; not prime.";
        return { result: "COMPOSITE", trace: trace, polyCoeffs: [] };
      }
  
      if (isPerfectPower(n)) {
        trace["Perfect Power Check"] = n.toString() + " is a perfect power. Composite.";
        return { result: "COMPOSITE", trace: trace, polyCoeffs: [] };
      } else {
        trace["Perfect Power Check"] = "Number is not a perfect power.";
      }
  
      let r = findSmallestR(n);
      trace["Find Smallest r"] = "Smallest r found: " + r.toString();
  
      let factorFound = false;
      for (let a = 2n; a <= r; a++) {
        let g = gcd(n, a);
        if (g > 1n && g < n) {
          trace["Factor Check"] = "Found small factor: " + a.toString();
          factorFound = true;
          break;
        }
      }
      if (factorFound) return { result: "COMPOSITE", trace: trace, polyCoeffs: [] };
      else trace["Factor Check"] = "No small factors found between 2 and r.";
  
      if (n <= r) {
        trace["n <= r Check"] = n.toString() + " ≤ r. Prime.";
        return { result: "PRIME", trace: trace, polyCoeffs: [] };
      } else {
        trace["n <= r Check"] = n.toString() + " > r. Proceeding to polynomial congruence test.";
      }
  
      let poly = [1n, 1n]; // represents (X+1)
      let polyExp = polyPow(poly, n, n, r);
      let polyExpStr = polyExp.map(x => x.toString()).join(", ");
      trace["Polynomial Exponentiation"] = "Computed (X+1)^n mod (n, X^r-1): " + polyExpStr;
  
      // Save coefficients for interactive diagram
      let polyCoeffs = polyExp.map(x => Number(x));
  
      let Xn = new Array(Number(r)).fill(0n);
      let expMod = Number(n % r);
      Xn[expMod] = 1n;
      Xn[0] = (Xn[0] + 1n) % n;
      let XnStr = Xn.map(x => x.toString()).join(", ");
      trace["Polynomial X^n + 1"] = "Computed X^n + 1 mod (n, X^r-1): " + XnStr;
  
      if (!polyEqual(polyExp, Xn, n, r)) {
        trace["Polynomial Test"] = "Polynomial congruence test fails. Composite.";
        return { result: "COMPOSITE", trace: trace, polyCoeffs: polyCoeffs };
      } else {
        trace["Polynomial Test"] = "Polynomial congruence test passes. Prime.";
        return { result: "PRIME", trace: trace, polyCoeffs: polyCoeffs };
      }
    }
  
    // --- Indefinite Prime Generator ---
    // This function continuously computes primes and updates the charts.
    let globalPrimes = [];
    function generatePrimesIndefinitely() {
      let num = 2;
      function next() {
        let isPrime = true;
        let limit = Math.sqrt(num);
        for (let i = 0; i < globalPrimes.length; i++) {
          if (globalPrimes[i] > limit) break;
          if (num % globalPrimes[i] === 0) {
            isPrime = false;
            break;
          }
        }
        if (isPrime) {
          globalPrimes.push(num);
          updateCharts(globalPrimes);
        }
        num++;
        // Use setTimeout to yield control and prevent blocking
        setTimeout(next, 0);
      }
      next();
    }
  
    // Update charts, displaying only the most recent 1000 primes to manage memory
    function updateCharts(primes) {
      let displayPrimes = primes;
      if (primes.length > 1000) {
        displayPrimes = primes.slice(primes.length - 1000);
      }
      updatePrimesChart(displayPrimes);
      updateGapsChart(displayPrimes);
    }
  
    // --- Smooth Chart Updating Functions using Chart.js ---
    let primesChart, gapsChart, polyChart;
  
    // Refactored: labels now display "Index: PrimeValue"
    function updatePrimesChart(primes) {
      let canvas = document.getElementById('primesChart');
      let labels = primes.map((prime, i) => (i + 1) + ": " + prime);
      if (primesChart) {
        primesChart.data.labels = labels;
        primesChart.data.datasets[0].data = primes;
        primesChart.options.plugins.title.text = 'Prime Index and Value';
        primesChart.update();
      } else {
        let ctx = canvas.getContext('2d');
        primesChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Prime Value',
              data: primes,
              borderColor: '#2c3e50',
              backgroundColor: 'rgba(44, 62, 80, 0.2)',
              pointRadius: 2,
              fill: true,
            }]
          },
          options: {
            responsive: true,
            animation: { duration: 0 },
            plugins: {
              title: {
                display: true,
                text: 'Prime Index and Value (Last 1000 Primes)'
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'Prime Index and Value' },
                ticks: { autoSkip: true, maxRotation: 45, minRotation: 45 }
              },
              y: {
                title: { display: true, text: 'Prime Number' }
              }
            }
          }
        });
      }
    }
  
    function updateGapsChart(primes) {
      let canvas = document.getElementById('gapsChart');
      let gaps = [];
      for (let i = 1; i < primes.length; i++) {
        gaps.push(primes[i] - primes[i - 1]);
      }
      if (gapsChart) {
        gapsChart.data.labels = gaps.map((_, i) => i + 1);
        gapsChart.data.datasets[0].data = gaps;
        gapsChart.update();
      } else {
        let ctx = canvas.getContext('2d');
        gapsChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: gaps.map((_, i) => i + 1),
            datasets: [{
              label: 'Gap Size',
              data: gaps,
              backgroundColor: 'rgba(52, 152, 219, 0.5)',
              borderColor: '#3498db',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            animation: { duration: 0 },
            plugins: {
              title: {
                display: true,
                text: 'Histogram of Prime Gaps'
              },
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'Gap Index' }
              },
              y: {
                title: { display: true, text: 'Gap Size' }
              }
            }
          }
        });
      }
    }
      
      
  
    // --- DOM Manipulation for Interactive Demo and Initialization ---
    document.addEventListener("DOMContentLoaded", function() {
      // Start indefinite prime generation
      generatePrimesIndefinitely();
  
      // Setup interactive prime check demo
      const inputField = document.getElementById("primeInput");
      const checkButton = document.getElementById("checkButton");
      const interactiveResult = document.getElementById("interactiveResult");
      const traceOutput = document.getElementById("traceOutput");
  
      checkButton.addEventListener("click", function() {
        // Clear previous trace output
        interactiveResult.textContent = "";
        traceOutput.innerHTML = "";
  
        let value = inputField.value;
        if (!value) {
          interactiveResult.textContent = "Please enter a number.";
          return;
        }
  
        let { result, trace, polyCoeffs } = primeAlgorithmWithTrace(value);
        interactiveResult.textContent = "Result: " + result;
  
        // Create interactive trace panels using details/summary elements.
        for (let step in trace) {
          let details = document.createElement("details");
          let summary = document.createElement("summary");
          summary.textContent = step;
          let div = document.createElement("div");
          div.className = "trace-step";
          div.textContent = trace[step];
          details.appendChild(summary);
          details.appendChild(div);
          traceOutput.appendChild(details);
        }
  
        // Render polynomial coefficients chart if available
        if (polyCoeffs.length > 0) {
          renderPolyChart(polyCoeffs);
        }
      });
    });
  })();
  