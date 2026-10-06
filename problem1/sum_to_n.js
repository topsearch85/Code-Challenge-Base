// Math Formula
var sum_to_n_a = function (n) {
    if (n >= 0) {
        return n * (n + 1) / 2;
    }
    return -((-n) * (-n + 1) / 2);
};

// Iterative
var sum_to_n_b = function (n) {
    let sum = 0;
    if (n >= 0) {
        for (let i = 1; i <= n; i++) {
            sum += i;
        }
    } else {
        for (let i = -1; i >= n; i--) {
            sum += i;
        }
    }
    return sum;
};

// Recursive
var sum_to_n_c = function (n) {
    if (n === 0) {
        return 0;
    }
    if (n > 0) {
        return n + sum_to_n_c(n - 1);
    }
    return n + sum_to_n_c(n + 1);
};

console.log(sum_to_n_a(5)); // Output: 15
console.log(sum_to_n_b(5)); // Output: 15
console.log(sum_to_n_c(5)); // Output: 15