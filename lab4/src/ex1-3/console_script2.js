/**
 * @file Counter and interactive shell utility.
 * Increments a counter stored in a file (sync or async) or provides a command-line shell.
 * 
 * Usage:
 *  node script.js --sync     // Increment synchronously
 *  node script.js --async    // Increment asynchronously
 *  node script.js            // Start interactive shell
 */

import fs from 'fs';
import readline from 'readline';
import { exec } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);
const fileName = path.resolve('data/counter.txt');

if (!fs.existsSync(fileName)) {
    fs.writeFileSync(fileName, '0', 'utf-8');
}

if (args.includes('--sync')) {
    let data = fs.readFileSync(fileName, 'utf-8');
    let count = parseInt(data);
    console.log('Liczba uruchomień:', count);
    fs.writeFileSync(fileName, String(count + 1), 'utf-8');

} else if (args.includes('--async')) {
    fs.readFile(fileName, 'utf-8', (err, data) => {
        if (err) throw err;
        let count = parseInt(data);
        console.log('Liczba uruchomień:', count);

        fs.writeFile(fileName, String(count + 1), 'utf-8', (err) => {
            if (err) throw err;
        });
    });

} else {
    console.log('Wprowadź komendy — naciśnięcie Ctrl+C kończy wprowadzanie danych.');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });

    rl.on('line', (line) => {
        const command = line.trim();
        if (command === '') {
            return;
        }

        exec(command, (err, output) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log(output);
            }
        });
    });
}
