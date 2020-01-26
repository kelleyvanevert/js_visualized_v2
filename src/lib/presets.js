import stripIndent from "common-tags/lib/stripIndent";

export default {
  "For-loop": stripIndent`
    for (let i = 0; i < 5; i++) {
      console.log(i);
    }

    // Alternatively:
    // for (let i of [0,1,2,3,4]) {
    //   console.log(i);
    // }

    // Or:
    // [0,1,2,3,4].forEach(i => {
    //   console.log(i);
    // });
  `,
  "While-loop": stripIndent`
    let i = 0;
    while (i < 5) {
      console.log(i);
      i = i + 1;
    }
  `,
  "Simple map transform": stripIndent`
    const result = [2, 4, 7].map(n => {
      return n + 10;
    });
  `,
  "Averaging grades with reduce": stripIndent`
    const grades = [4, 8.1, 2.5, 9, 7.8];

    function sum(total, grade) {
      console.log(total, grade);
      return total + grade;
    }

    const avg = grades.reduce(sum, 0) / grades.length;
  `,
  Fibonacci: stripIndent`
    const fib = [1, 1];

    while (fib.length < 7) {
      const [a, b] = fib.slice(-2);
      fib.push(a + b);
    }
  `,
  "Object spread": stripIndent`
    const original = {
      name: "Granny Smith",
      color: "green"
    };

    const updated_v1 = {
      color: "red",
      ...original
    };

    const updated_v2 = {
      ...original,
      color: "red"
    };
  `,
  "Array spread": stripIndent`
    const siblings = ["Kelley", "Heleen"];

    const updated_v1 = [...siblings, "Elsie"];

    const updated_v2 = ["Elsie", ...siblings];
  `,
  "Object destructuring": stripIndent`
    const pikachu = {
      name: "Pikachu",
      category: "Mouse Pokémon",
      info: {
        weight: 6, // kg
        height: 0.4 // m
      },
      moreInfo: { no: 25, catchRate: 190 }
    };

    const { category } = pikachu;

    const { name, info: { weight }, moreInfo, bla } = pikachu;
  `,
  "Array destructuring": stripIndent`
    const philosophers = [
      "Descartes", "Hobbes",
      "Leibniz", "Kant"
    ];

    const [first, ...rest] = philosophers;
    // const [...most, last] = philosophers; // <-- not allowed :(
  `,
  this: stripIndent`
    function sayHello() {
      console.log("Hi, my name is", this.name);
    }

    // sayHello(); // Cannot read property 'name' of undefined
    sayHello.call({ name: "Philosoraptor" });

    const duck = {
      name: "Donald Duck",
      sayHello
    };

    duck.sayHello();
  `,
  setTimeout: stripIndent`
    setTimeout(() => {
      console.log("hello from the future!");
    }, 100);
  `,
  "Promise / fetch": stripIndent`
    const promise = fetch("https://xkcd.now.sh/?comic=303");

    const promise2 = promise.then(res => {
      console.log(res.status);
      return res.json();
    });

    promise2.then(data => {
      console.log(data);
    });

    console.log("done?");
  `,
  IIFE: stripIndent`
    (function (){
      console.log(this);
    }());
  `,
  "Circular data": stripIndent`
    const a = {};
    const b = { a };
    a.b = b;
  `,
  "Update expressions (avoid!)": stripIndent`
    // These are really just here for testing. Try to avoid :D
    let i;
    i = 0; ++i;
    i = 0; i++;
    i = 0; ++i + ++i;
    i = 0; i++ + i++;

    let o = {};
    o.i = 0; ++o.i;
    o.i = 0; o.i++;
    o.i = 0; ++o.i + ++o.i;
    o.i = 0; o.i++ + o.i++;
  `
};
