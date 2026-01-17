import readline from 'node:readline';

export function ask(question, callback, { createInterface } = readline) {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    let text = '';

    if (Array.isArray(question)) {
      text = `\x1b[1m${question[0]}\x1b[0m \x1b[2m${question[1]}\x1b[0m`;
    } else if (typeof question === 'string') {
      text = `\x1b[1m${question}\x1b[0m`;
    }

    rl.question(text, (answer) => {
      rl.close();
      if (callback) {
        callback(answer);
      }
      resolve(answer);
    });
  });
}
