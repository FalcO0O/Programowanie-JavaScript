onmessage = function(event) {
    let primes = [];
    for (let i = 0; i < parseInt(event.data); i++) {
        let candidate = i * (1000000000 * Math.random());
        let isPrime = true;
        for (var c = 2; c <= Math.sqrt(candidate); ++c) {
            if (candidate % c === 0) {
                // not prime
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            primes.push(candidate);
        }
    }
    postMessage(primes);
}
