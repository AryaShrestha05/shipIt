function greet(name) {
  return `Howdy, ${name}!`;
}

function main() {
  const user = 'Arya';
  console.log(greet(user));
  const secondUser = 'Sam';
  console.log(greet(secondUser));
}

main();
