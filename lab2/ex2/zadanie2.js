function sum(x,y) {
    return x+y;
}

function sum_strings(a)
{
    let result = 0;
    for (const text of a) {
        let digits = ""
        for(const letter of text) {
            if(isDigit(letter)) {
                digits += letter;
            } else {
                break;
            }
        }
        for (const index in digits) {
            result += 10**(digits.length - index - 1) * digits[index];
        }
    }
    return result;
}

function isDigit(c) {
    return c >= '0' && c <= '9';
}

function digits(s)
{
    let even = 0;
    let uneven = 0;
    for (const char of s) {
        if(isDigit(char)) {
            const num = parseInt(char);
            (num % 2 === 0) ? even += num : uneven += num;
        }
    }
    return [uneven, even];
}

function letters(s)
{
    let upperCase = 0;
    let lowerCase = 0;
    for(const char of s) {
        if (isDigit(char)) continue;
        if(char.toLowerCase() === char) {
            lowerCase++;
        } else if(char.toUpperCase() === char) {
            upperCase++;
        }
    }
    return [lowerCase, upperCase];
}
