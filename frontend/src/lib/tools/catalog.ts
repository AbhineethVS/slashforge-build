import type { LearningTool } from './types'

export const LEARNING_TOOLS: LearningTool[] = [
  {
    "id": "phet-interactive-simulations",
    "name": "PhET Interactive Simulations",
    "url": "https://phet.colorado.edu/",
    "description": "Free interactive simulations for physics, chemistry, biology, Earth science, mathematics, and statistics. Excellent for changing variables and seeing systems respond in real time.",
    "keywords": [
      "physics",
      "chemistry",
      "biology",
      "earth science",
      "math",
      "statistics",
      "simulation",
      "interactive simulation",
      "visualization",
      "experiments",
      "forces",
      "motion",
      "projectile motion",
      "electricity",
      "circuits",
      "waves",
      "optics",
      "atoms",
      "quantum",
      "gases",
      "pressure",
      "concentration",
      "pH",
      "chemical reactions",
      "vectors",
      "probability"
    ],
    "domains": [
      "general-stem",
      "mathematics",
      "physics"
    ],
    "learningModes": [
      "simulate",
      "visualize",
      "experiment"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "Changing a variable and watching the system respond is faster than rereading a diagram."
  },
  {
    "id": "geogebra",
    "name": "GeoGebra",
    "url": "https://www.geogebra.org/",
    "description": "Interactive math platform covering graphing, geometry, 3D geometry, CAS, probability, statistics, calculus, and dynamic constructions.",
    "keywords": [
      "mathematics",
      "graphing",
      "geometry",
      "3D geometry",
      "algebra",
      "calculus",
      "derivatives",
      "integrals",
      "vectors",
      "matrices",
      "trigonometry",
      "conics",
      "transformations",
      "probability",
      "statistics",
      "functions",
      "coordinate geometry",
      "dynamic geometry",
      "CAS",
      "civil engineering",
      "structural geometry",
      "forces",
      "curves"
    ],
    "domains": [
      "general-stem",
      "mathematics",
      "physics"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "build"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "desmos",
    "name": "Desmos",
    "url": "https://www.desmos.com/calculator",
    "description": "Fast browser-based graphing and mathematical exploration tool for equations, functions, tables, sliders, transformations, and geometry/3D exploration.",
    "keywords": [
      "math",
      "graph",
      "graphing calculator",
      "functions",
      "equations",
      "curves",
      "parabolas",
      "trigonometry",
      "calculus",
      "sliders",
      "transformations",
      "tables",
      "statistics",
      "regression",
      "coordinates",
      "3D graphing",
      "plotting",
      "parameters",
      "data visualization",
      "function",
      "graphing",
      "mathematical modeling"
    ],
    "domains": [
      "general-stem",
      "mathematics",
      "physics"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "calculate"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "Parameter sliders make functions behave instead of sitting as equations."
  },
  {
    "id": "mathigon",
    "name": "Mathigon",
    "url": "https://mathigon.org/",
    "description": "Interactive mathematics platform with manipulatives, visual explanations, activities, and Polypad for exploring abstract mathematical ideas physically on screen.",
    "keywords": [
      "math",
      "mathematics",
      "manipulatives",
      "Polypad",
      "geometry",
      "fractions",
      "algebra",
      "graph theory",
      "probability",
      "combinatorics",
      "fractals",
      "symmetry",
      "sequences",
      "vectors",
      "interactive math",
      "visual math"
    ],
    "domains": [
      "general-stem",
      "mathematics",
      "physics"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "seeing-theory",
    "name": "Seeing Theory",
    "url": "https://seeing-theory.brown.edu/",
    "description": "Interactive visual introduction to probability and statistics, with experiments and visualizations for distributions, Bayesian inference, regression, and inference.",
    "keywords": [
      "probability",
      "statistics",
      "distributions",
      "random variables",
      "Bayes theorem",
      "Bayesian inference",
      "regression",
      "confidence intervals",
      "hypothesis testing",
      "sampling",
      "normal distribution",
      "binomial distribution",
      "data visualization"
    ],
    "domains": [
      "general-stem",
      "mathematics",
      "physics"
    ],
    "learningModes": [
      "visualize",
      "experiment"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "wolfram-alpha",
    "name": "Wolfram|Alpha",
    "url": "https://www.wolframalpha.com/",
    "description": "Computational knowledge engine for symbolic math, equations, plots, units, physics, chemistry, statistics, and many engineering calculations.",
    "keywords": [
      "calculator",
      "symbolic algebra",
      "equations",
      "derivatives",
      "integrals",
      "matrices",
      "vectors",
      "units",
      "dimensional analysis",
      "physics",
      "chemistry",
      "statistics",
      "plotting",
      "optimization",
      "engineering math"
    ],
    "domains": [
      "general-stem",
      "mathematics",
      "physics"
    ],
    "learningModes": [
      "visualize",
      "calculate"
    ],
    "featured": false,
    "popular": true
  },
  {
    "id": "symbolab",
    "name": "Symbolab",
    "url": "https://www.symbolab.com/",
    "description": "Step-by-step mathematical solver covering algebra, calculus, trigonometry, statistics, differential equations, matrices, and graphing.",
    "keywords": [
      "math solver",
      "step by step",
      "algebra",
      "calculus",
      "derivatives",
      "integrals",
      "differential equations",
      "limits",
      "matrices",
      "vectors",
      "trigonometry",
      "graphing",
      "equations"
    ],
    "domains": [
      "general-stem",
      "mathematics",
      "physics"
    ],
    "learningModes": [
      "visualize",
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "python-tutor",
    "name": "Python Tutor",
    "url": "https://pythontutor.com/",
    "description": "Step-through visualizer for program execution. Shows variables, objects, stack frames, references, and control flow while code runs.",
    "keywords": [
      "Python",
      "Java",
      "C",
      "C++",
      "JavaScript",
      "code execution",
      "flow of execution",
      "variables",
      "stack",
      "heap",
      "references",
      "pointers",
      "recursion",
      "debugging",
      "step through code",
      "data structures",
      "program visualization",
      "execution trace"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "visualize",
      "run-code"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "Static code cannot show how variables, references, and the stack change as the program runs."
  },
  {
    "id": "visualgo",
    "name": "VisuAlgo",
    "url": "https://visualgo.net/",
    "description": "Interactive visualization and learning platform for algorithms and data structures, including sorting, trees, graphs, shortest paths, MSTs, and more.",
    "keywords": [
      "algorithms",
      "data structures",
      "sorting",
      "bubble sort",
      "insertion sort",
      "merge sort",
      "quicksort",
      "heap",
      "binary tree",
      "AVL tree",
      "BST",
      "trie",
      "graph",
      "BFS",
      "DFS",
      "Dijkstra",
      "minimum spanning tree",
      "Kruskal",
      "Prim",
      "recursion",
      "visualization"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "Algorithm traces on paper hide the movement of data through structures."
  },
  {
    "id": "computer-science-field-guide",
    "name": "Computer Science Field Guide",
    "url": "https://www.csfieldguide.org.nz/",
    "description": "Large collection of CS teaching material and interactives spanning algorithms, data representation, programming, networking, security, graphics, compression, and more.",
    "keywords": [
      "computer science",
      "algorithms",
      "programming",
      "binary",
      "data representation",
      "encryption",
      "RSA",
      "hashing",
      "compression",
      "QR code",
      "regular expressions",
      "networking",
      "computer vision",
      "graphics",
      "MIPS",
      "simulation"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "simulate",
      "visualize",
      "run-code"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "compiler-explorer",
    "name": "Compiler Explorer",
    "url": "https://godbolt.org/",
    "description": "Interactive compiler playground that shows how source code is translated into assembly and other compiler outputs across many languages and compilers.",
    "keywords": [
      "compiler",
      "assembly",
      "machine code",
      "C",
      "C++",
      "Rust",
      "Go",
      "optimization",
      "LLVM",
      "GCC",
      "Clang",
      "x86",
      "ARM",
      "RISC-V",
      "compiler optimization",
      "disassembly",
      "instruction set",
      "code generation"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "run-code"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "ripes",
    "name": "Ripes",
    "url": "https://ripes.dk/",
    "description": "Visual RISC-V processor simulator and educational environment for exploring assembly, datapaths, pipelines, caches, and processor microarchitecture.",
    "keywords": [
      "computer architecture",
      "RISC-V",
      "assembly",
      "CPU",
      "datapath",
      "pipeline",
      "hazard",
      "cache",
      "registers",
      "ALU",
      "instruction cycle",
      "processor",
      "microarchitecture",
      "memory",
      "ISA",
      "embedded systems"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "simulate",
      "visualize",
      "design"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "Processor pipelines only click when you watch an instruction move through hardware stages."
  },
  {
    "id": "nand2tetris",
    "name": "Nand2Tetris",
    "url": "https://www.nand2tetris.org/",
    "description": "Hands-on course ecosystem for building a computer from basic logic gates upward, with hardware and software simulators.",
    "keywords": [
      "computer architecture",
      "digital logic",
      "NAND gate",
      "boolean logic",
      "CPU",
      "ALU",
      "memory",
      "assembler",
      "virtual machine",
      "operating system",
      "hardware simulator",
      "HDL",
      "machine language"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "simulate",
      "build",
      "practice",
      "design"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "sqlbolt",
    "name": "SQLBolt",
    "url": "https://sqlbolt.com/",
    "description": "Short interactive SQL lessons where learners write and run queries in the browser.",
    "keywords": [
      "SQL",
      "database",
      "SELECT",
      "WHERE",
      "JOIN",
      "GROUP BY",
      "ORDER BY",
      "aggregate functions",
      "relational database",
      "queries",
      "SQLite",
      "database practice"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "practice"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "go-playground",
    "name": "Go Playground",
    "url": "https://go.dev/play/",
    "description": "Browser environment for writing and running Go programs without installing the language toolchain.",
    "keywords": [
      "Go",
      "Golang",
      "programming",
      "compiler",
      "concurrency",
      "goroutines",
      "channels",
      "syntax",
      "standard library",
      "code execution"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "run-code"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "rust-playground",
    "name": "Rust Playground",
    "url": "https://play.rust-lang.org/",
    "description": "Browser playground for compiling and running Rust examples and experimenting with language features.",
    "keywords": [
      "Rust",
      "programming",
      "ownership",
      "borrowing",
      "lifetimes",
      "traits",
      "generics",
      "compiler",
      "cargo",
      "code execution",
      "memory safety"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "simulate",
      "run-code",
      "experiment"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "regex101",
    "name": "Regex101",
    "url": "https://regex101.com/",
    "description": "Interactive regular-expression tester with explanations, matching, debugging, and multiple regex flavors.",
    "keywords": [
      "regex",
      "regular expressions",
      "pattern matching",
      "parsing",
      "text processing",
      "string matching",
      "PCRE",
      "JavaScript regex",
      "Python regex",
      "debugging regex"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "jupyterlite",
    "name": "JupyterLite",
    "url": "https://jupyter.org/try-jupyter/lab/",
    "description": "Browser-based Jupyter environment for experimentation with notebooks, Python, data analysis, and visualization without a traditional local install.",
    "keywords": [
      "Jupyter",
      "Python",
      "notebooks",
      "data science",
      "NumPy",
      "pandas",
      "matplotlib",
      "coding",
      "experiments",
      "data visualization",
      "interactive computing"
    ],
    "domains": [
      "computer-science"
    ],
    "learningModes": [
      "visualize",
      "run-code",
      "experiment"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "falstad-circuit-simulator",
    "name": "Falstad Circuit Simulator",
    "url": "https://www.falstad.com/circuit/",
    "description": "Fast visual circuit simulator where current is animated and voltages/currents can be inspected interactively. Includes many sample circuits and logic circuits.",
    "keywords": [
      "circuit simulator",
      "electronics",
      "electrical engineering",
      "voltage",
      "current",
      "resistor",
      "capacitor",
      "inductor",
      "RC",
      "RL",
      "RLC",
      "transient response",
      "AC",
      "DC",
      "diode",
      "transistor",
      "op amp",
      "logic gates",
      "three phase",
      "transformers",
      "filters",
      "current flow",
      "circuit visualization"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "simulate",
      "visualize"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "Static circuit diagrams cannot show how voltage and current change over time."
  },
  {
    "id": "ltspice",
    "name": "LTspice",
    "url": "https://www.analog.com/en/resources/design-tools-and-calculators/ltspice-simulator.html",
    "description": "Widely used SPICE-based analog circuit simulator from Analog Devices for detailed circuit analysis and design.",
    "keywords": [
      "LTspice",
      "SPICE",
      "circuit simulation",
      "analog",
      "op amp",
      "transistor",
      "MOSFET",
      "BJT",
      "diode",
      "AC analysis",
      "transient analysis",
      "frequency response",
      "filter",
      "amplifier",
      "power supply",
      "switching",
      "electronics design"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "simulate",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "qspice",
    "name": "QSPICE",
    "url": "https://www.qorvo.com/design-hub/design-tools/interactive/qspice",
    "description": "Modern SPICE simulation environment with support for analog, mixed-signal, and behavioral modeling.",
    "keywords": [
      "QSPICE",
      "SPICE",
      "analog",
      "mixed signal",
      "transistor",
      "op amp",
      "switching power supply",
      "simulation",
      "waveform",
      "circuit analysis",
      "electronics"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "circuitverse",
    "name": "CircuitVerse",
    "url": "https://circuitverse.org/simulator",
    "description": "Open-source browser-based digital logic simulator for building and visualizing combinational and sequential circuits.",
    "keywords": [
      "digital logic",
      "logic gates",
      "boolean algebra",
      "AND",
      "OR",
      "NOT",
      "NAND",
      "NOR",
      "XOR",
      "XNOR",
      "multiplexer",
      "decoder",
      "encoder",
      "flip flop",
      "register",
      "counter",
      "timing diagram",
      "combinational logic",
      "sequential logic",
      "digital circuits"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "simulate",
      "visualize",
      "build"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "Digital logic becomes clear when you wire the gates yourself and inspect the timing."
  },
  {
    "id": "wokwi",
    "name": "Wokwi",
    "url": "https://wokwi.com/",
    "description": "Browser-based electronics and microcontroller simulator for Arduino, ESP32, Raspberry Pi Pico, and other embedded hardware.",
    "keywords": [
      "Arduino",
      "ESP32",
      "Raspberry Pi Pico",
      "microcontroller",
      "embedded systems",
      "GPIO",
      "sensors",
      "LED",
      "servo",
      "I2C",
      "SPI",
      "UART",
      "electronics simulation",
      "firmware",
      "embedded programming",
      "IoT",
      "breadboard",
      "MCU",
      "embedded",
      "actuators",
      "simulation"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "simulate",
      "run-code"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "tinkercad-circuits",
    "name": "Tinkercad Circuits",
    "url": "https://www.tinkercad.com/circuits",
    "description": "Beginner-friendly browser environment for Arduino, breadboards, components, and introductory electronics simulation.",
    "keywords": [
      "Arduino",
      "circuits",
      "breadboard",
      "electronics",
      "LED",
      "resistor",
      "sensor",
      "microcontroller",
      "Tinkercad",
      "beginner electronics",
      "digital circuits",
      "analog circuits",
      "embedded systems",
      "GPIO",
      "LEDs",
      "sensors",
      "prototyping"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "explore-3d",
      "simulate",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "circuitlab",
    "name": "CircuitLab",
    "url": "https://www.circuitlab.com/",
    "description": "Browser-based circuit drawing and simulation environment for analog and digital circuit analysis.",
    "keywords": [
      "circuit simulator",
      "schematic",
      "analog circuit",
      "digital circuit",
      "voltage",
      "current",
      "resistor",
      "capacitor",
      "inductor",
      "op amp",
      "transistor",
      "filter",
      "electronics design",
      "circuit analysis"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "simulate",
      "build",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "multisim-live",
    "name": "Multisim Live",
    "url": "https://www.multisim.com/",
    "description": "Browser-based circuit design and simulation environment from NI, useful for classroom demonstrations and interactive circuit experiments.",
    "keywords": [
      "Multisim",
      "circuit simulation",
      "electronics",
      "schematic",
      "SPICE",
      "digital logic",
      "analog",
      "op amp",
      "transistor",
      "waveform",
      "virtual lab",
      "circuit analysis"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "simulate",
      "build",
      "experiment",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "easyeda",
    "name": "EasyEDA",
    "url": "https://easyeda.com/",
    "description": "Web-based electronics design platform for schematics, PCB layout, component libraries, and online design workflows.",
    "keywords": [
      "PCB",
      "schematic",
      "electronics design",
      "circuit board",
      "PCB layout",
      "EDA",
      "components",
      "footprints",
      "routing",
      "Gerber",
      "electronics",
      "ESP32",
      "Arduino",
      "KiCad alternative"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "explore-3d",
      "build",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "kicad",
    "name": "KiCad",
    "url": "https://www.kicad.org/",
    "description": "Open-source electronics design suite for schematics, PCB layout, libraries, and circuit/board workflows.",
    "keywords": [
      "KiCad",
      "PCB",
      "schematic",
      "EDA",
      "circuit board",
      "PCB design",
      "routing",
      "footprint",
      "symbol library",
      "Gerber",
      "SPICE",
      "electronics",
      "embedded systems"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "explore-3d",
      "simulate",
      "build",
      "design"
    ],
    "featured": false,
    "popular": true
  },
  {
    "id": "digital",
    "name": "Digital",
    "url": "https://github.com/hneemann/Digital",
    "description": "Educational digital-logic design and simulation tool for gates, circuits, and CPU-like systems.",
    "keywords": [
      "digital logic",
      "logic gates",
      "boolean algebra",
      "Karnaugh map",
      "flip flop",
      "register",
      "counter",
      "CPU",
      "simulator",
      "digital electronics",
      "sequential logic"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "simulate",
      "visualize",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "everycircuit",
    "name": "EveryCircuit",
    "url": "https://everycircuit.com/",
    "description": "Interactive circuit simulator focused on immediate visual feedback and animated circuit behavior.",
    "keywords": [
      "circuit simulator",
      "electronics",
      "analog",
      "digital",
      "voltage",
      "current",
      "transistor",
      "MOSFET",
      "op amp",
      "capacitor",
      "inductor",
      "waveform",
      "breadboard",
      "circuit visualization"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "simulate",
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "sigrok-pulseview",
    "name": "Sigrok / PulseView",
    "url": "https://sigrok.org/wiki/PulseView",
    "description": "Open-source signal analysis software for logic analyzers, oscilloscopes, and other measurement hardware.",
    "keywords": [
      "oscilloscope",
      "logic analyzer",
      "signal analysis",
      "digital signal",
      "UART",
      "SPI",
      "I2C",
      "protocol decoding",
      "waveform",
      "electronics debugging",
      "embedded debugging"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "ti-precision-labs",
    "name": "TI Precision Labs",
    "url": "https://www.ti.com/video/series/precision-labs.html",
    "description": "Texas Instruments' educational video and lab-style resource collection for analog, power, amplifiers, ADCs, interfaces, and other electronics topics.",
    "keywords": [
      "analog electronics",
      "op amp",
      "ADC",
      "DAC",
      "power electronics",
      "sensors",
      "signal conditioning",
      "amplifiers",
      "embedded",
      "electronics design",
      "TI",
      "circuit fundamentals"
    ],
    "domains": [
      "electronics",
      "electrical"
    ],
    "learningModes": [
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "grabcad-library",
    "name": "GrabCAD Library",
    "url": "https://grabcad.com/library",
    "description": "Community CAD repository containing many vehicle components, engines, transmissions, suspension components, brackets, fixtures, and assemblies.",
    "keywords": [
      "CAD",
      "3D CAD",
      "SolidWorks",
      "STEP",
      "STL",
      "engineering models",
      "mechanical parts",
      "assemblies",
      "engines",
      "gearbox",
      "bearings",
      "fasteners",
      "mechanism",
      "product design",
      "machine design",
      "3D models",
      "CAD files",
      "car",
      "engine",
      "automotive",
      "piston",
      "crankshaft",
      "transmission",
      "suspension",
      "chassis",
      "wheel",
      "brake",
      "assembly"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "design"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "mcmaster-carr-cad-models",
    "name": "McMaster-Carr CAD Models",
    "url": "https://www.mcmaster.com/cad-models",
    "description": "Useful for assembling realistic mechanical designs from accurate bearings, fasteners, shafts, gears, springs, tubing, brackets, and other components.",
    "keywords": [
      "CAD",
      "3D CAD",
      "fasteners",
      "bolts",
      "nuts",
      "bearings",
      "shafts",
      "gears",
      "springs",
      "tubing",
      "fittings",
      "motors",
      "hardware",
      "components",
      "engineering parts",
      "STEP",
      "SolidWorks",
      "Parasolid",
      "product design",
      "engine component",
      "bearing",
      "shaft",
      "gear",
      "spring",
      "fastener",
      "bolt",
      "nut",
      "fitting",
      "mechanical assembly",
      "machine design",
      "CAD component"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "design"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "traceparts",
    "name": "TraceParts",
    "url": "https://www.traceparts.com/",
    "description": "Huge engineering component library spanning mechanical, electrical, electronics, hydraulics, pneumatics, materials, sensors, PCB, CAE, and BIM content.",
    "keywords": [
      "CAD",
      "3D models",
      "mechanical components",
      "electrical components",
      "electronics",
      "sensors",
      "hydraulics",
      "pneumatics",
      "fasteners",
      "bearings",
      "beams",
      "tubes",
      "BIM",
      "CAE",
      "ECAD",
      "MCAD",
      "STEP",
      "DWG"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "build",
      "design"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "3d-contentcentral",
    "name": "3D ContentCentral",
    "url": "https://www.3dcontentcentral.com/",
    "description": "Free library for supplier-certified and community 3D parts, assemblies, drawings, macros, and engineering components.",
    "keywords": [
      "CAD",
      "SolidWorks",
      "3D models",
      "assemblies",
      "electrical components",
      "motors",
      "gears",
      "bearings",
      "piping",
      "hardware",
      "actuators",
      "flanges",
      "transformers",
      "connectors",
      "STEP",
      "mechanical engineering"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "3dfindit-partcommunity",
    "name": "3Dfindit / PARTcommunity",
    "url": "https://www.3dfindit.com/",
    "description": "Search and download portal for manufacturer-provided CAD, CAE, and BIM models, with visual and geometric search.",
    "keywords": [
      "CAD",
      "3Dfindit",
      "PARTcommunity",
      "manufacturer CAD",
      "components",
      "mechanical parts",
      "BIM",
      "CAE",
      "visual search",
      "geometric search",
      "bearings",
      "motors",
      "pneumatics",
      "automation",
      "engineering components"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "sketchfab",
    "name": "Sketchfab",
    "url": "https://sketchfab.com/",
    "description": "Browser-based 3D model platform with millions of models and an interactive viewer. Particularly useful for anatomy, machines, artifacts, vehicles, industrial objects, and educational 3D content.",
    "keywords": [
      "3D models",
      "interactive 3D",
      "anatomy",
      "vehicles",
      "machines",
      "engine",
      "mechanical",
      "architecture",
      "historical objects",
      "science",
      "education",
      "AR",
      "VR",
      "model viewer",
      "rotate",
      "exploded view",
      "engineering visualization"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "design"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "onshape",
    "name": "Onshape",
    "url": "https://www.onshape.com/",
    "description": "Cloud-native parametric CAD system with collaborative modeling, assemblies, drawings, and browser-based engineering workflows.",
    "keywords": [
      "CAD",
      "parametric CAD",
      "mechanical design",
      "assemblies",
      "parts",
      "engineering drawing",
      "sketch",
      "constraints",
      "feature tree",
      "product design",
      "collaborative CAD",
      "browser CAD",
      "3D modeling"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "simulate",
      "build",
      "design"
    ],
    "featured": false,
    "popular": true
  },
  {
    "id": "autodesk-fusion",
    "name": "Autodesk Fusion",
    "url": "https://www.autodesk.com/products/fusion-360/overview",
    "description": "Integrated CAD/CAM/CAE environment for product design, mechanical modeling, assemblies, manufacturing, rendering, and engineering workflows.",
    "keywords": [
      "Fusion 360",
      "CAD",
      "CAM",
      "CAE",
      "mechanical design",
      "3D modeling",
      "assembly",
      "machining",
      "CNC",
      "manufacturing",
      "parametric modeling",
      "simulation",
      "product design",
      "sheet metal",
      "milling",
      "turning",
      "toolpath",
      "G-code",
      "cutting tools",
      "feeds",
      "speeds"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "simulate",
      "build",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "freecad",
    "name": "FreeCAD",
    "url": "https://www.freecad.org/",
    "description": "Open-source parametric 3D CAD modeler suitable for mechanical engineering, architecture, parts, assemblies, and technical modeling.",
    "keywords": [
      "FreeCAD",
      "CAD",
      "parametric CAD",
      "mechanical engineering",
      "3D modeling",
      "STEP",
      "STL",
      "assemblies",
      "part design",
      "FEM",
      "architecture",
      "open source",
      "engineering drawing",
      "CAM",
      "CNC",
      "machining",
      "toolpath",
      "manufacturing",
      "G-code",
      "milling",
      "turning",
      "CAD/CAM"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "build",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "openscad",
    "name": "OpenSCAD",
    "url": "https://openscad.org/",
    "description": "Script-based solid CAD modeler where objects are generated from code, making it especially useful for parametric and programmable geometry.",
    "keywords": [
      "OpenSCAD",
      "CAD",
      "parametric design",
      "programmable CAD",
      "3D printing",
      "solid modeling",
      "scripting",
      "geometry",
      "variables",
      "constraints",
      "engineering design"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "build",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "solid-edge-community-siemens",
    "name": "Solid Edge Community / Siemens",
    "url": "https://resources.sw.siemens.com/en-US/download-solid-edge-community-edition/",
    "description": "Siemens CAD ecosystem with community/student-oriented access and strong mechanical parametric modeling capabilities.",
    "keywords": [
      "Solid Edge",
      "CAD",
      "mechanical engineering",
      "parametric modeling",
      "assembly",
      "sheet metal",
      "synchronous modeling",
      "drafting",
      "3D design"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "build",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "blender",
    "name": "Blender",
    "url": "https://www.blender.org/",
    "description": "Open-source 3D creation suite for modeling, sculpting, animation, rendering, and visualization. While not engineering CAD-first, it is excellent for visual 3D exploration and communicating mechanisms.",
    "keywords": [
      "Blender",
      "3D modeling",
      "mesh",
      "visualization",
      "rendering",
      "animation",
      "mechanism animation",
      "engineering visualization",
      "product visualization",
      "simulation visualization",
      "CAD import"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "simulate",
      "visualize",
      "design"
    ],
    "featured": false,
    "popular": true
  },
  {
    "id": "thingiverse",
    "name": "Thingiverse",
    "url": "https://www.thingiverse.com/",
    "description": "Large repository of community-created 3D-printable models, including functional parts, mechanisms, tools, educational objects, and prototypes.",
    "keywords": [
      "3D printing",
      "STL",
      "3D models",
      "mechanical parts",
      "mechanisms",
      "robotics",
      "engineering projects",
      "prototypes",
      "printable parts",
      "maker",
      "fabrication"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "printables",
    "name": "Printables",
    "url": "https://www.printables.com/",
    "description": "Community platform for 3D-printable models with a large collection of functional objects, mechanisms, tools, educational models, and engineering projects.",
    "keywords": [
      "3D printing",
      "STL",
      "3D models",
      "mechanisms",
      "engineering",
      "robotics",
      "parts",
      "prototypes",
      "CAD",
      "fabrication",
      "maker projects"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "thangs",
    "name": "Thangs",
    "url": "https://thangs.com/",
    "description": "3D model search and discovery platform with strong search capabilities across printable and mechanical models.",
    "keywords": [
      "3D model search",
      "STL",
      "CAD",
      "3D printing",
      "mechanical parts",
      "gears",
      "mechanisms",
      "robotics",
      "models",
      "reverse search",
      "geometry search"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "turbosquid",
    "name": "TurboSquid",
    "url": "https://www.turbosquid.com/",
    "description": "Large professional 3D asset marketplace/library. Useful in LUMA mainly for visualizing vehicles, machines, architecture, industrial objects, and other complex 3D subjects.",
    "keywords": [
      "3D model",
      "vehicle",
      "car",
      "engine",
      "machinery",
      "industrial",
      "architecture",
      "human",
      "anatomy",
      "aircraft",
      "visualization",
      "3D asset",
      "model viewer"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "cgtrader",
    "name": "CGTrader",
    "url": "https://www.cgtrader.com/",
    "description": "3D model marketplace with a broad mix of engineering-adjacent, vehicle, architecture, industrial, and scientific models.",
    "keywords": [
      "3D models",
      "CAD",
      "vehicles",
      "cars",
      "engines",
      "aircraft",
      "architecture",
      "industrial design",
      "mechanical parts",
      "visualization",
      "engineering models"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "mechsim",
    "name": "MechSim",
    "url": "https://www.mechsim.app/",
    "description": "Free browser-based planar mechanism simulator where users build linkages, sliders, and joints, then watch motion and export kinematic data.",
    "keywords": [
      "mechanism",
      "kinematics",
      "four bar linkage",
      "slider crank",
      "linkage",
      "joints",
      "pin joint",
      "slider",
      "coupler curve",
      "displacement",
      "velocity",
      "acceleration",
      "motion analysis",
      "mechanical engineering"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "simulate",
      "build"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "Linkage motion is easier to trust when you drag the joints yourself."
  },
  {
    "id": "motiongen",
    "name": "MotionGen",
    "url": "https://motiongen.io/",
    "description": "Interactive mechanism design and simulation tool focused on understanding how mechanical linkages fit together and move.",
    "keywords": [
      "mechanism",
      "kinematics",
      "linkage",
      "four-bar",
      "slider",
      "crank",
      "motion",
      "mechanical design",
      "mechanism synthesis",
      "robotics",
      "linkage simulation"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "simulate",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "myphysicslab",
    "name": "MyPhysicsLab",
    "url": "https://www.myphysicslab.com/",
    "description": "Interactive physics simulations including pendulums, springs, collisions, vehicles, and mechanical systems.",
    "keywords": [
      "mechanics",
      "physics simulation",
      "kinematics",
      "dynamics",
      "pendulum",
      "spring",
      "collision",
      "friction",
      "oscillation",
      "rotational motion",
      "rigid body",
      "mechanical system",
      "energy"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "algodoo",
    "name": "Algodoo",
    "url": "https://www.algodoo.com/",
    "description": "2D physics sandbox for constructing and experimenting with mechanical systems, forces, materials, fluids, and motion.",
    "keywords": [
      "physics sandbox",
      "mechanics",
      "dynamics",
      "kinematics",
      "forces",
      "friction",
      "springs",
      "collisions",
      "pulleys",
      "gears",
      "motion",
      "simulation",
      "engineering intuition"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "simulate",
      "build",
      "experiment"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "kmoddl-kinematic-models-for-design-digital-library",
    "name": "KMODDL \u2014 Kinematic Models for Design Digital Library",
    "url": "https://kmoddl.library.cornell.edu/",
    "description": "Digital collection focused on mechanisms and kinematics, with models and historical/mechanical demonstrations.",
    "keywords": [
      "mechanisms",
      "kinematics",
      "machine design",
      "linkage",
      "gears",
      "cams",
      "four bar",
      "mechanical motion",
      "mechanism library",
      "machine theory"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "simulate",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "engineering-toolbox",
    "name": "Engineering Toolbox",
    "url": "https://www.engineeringtoolbox.com/",
    "description": "Extremely broad engineering reference containing equations, property tables, calculators, unit conversions, fluid data, thermal data, HVAC information, and materials data.",
    "keywords": [
      "engineering calculator",
      "materials",
      "thermodynamics",
      "heat transfer",
      "fluids",
      "pressure",
      "flow",
      "viscosity",
      "pumps",
      "pipes",
      "HVAC",
      "mechanical engineering",
      "civil engineering",
      "electrical engineering",
      "units",
      "conversion",
      "construction",
      "concrete",
      "soil",
      "pipe flow",
      "loads",
      "unit conversion",
      "fluid mechanics",
      "water",
      "engineering data",
      "Reynolds number",
      "pressure drop",
      "fans",
      "heat exchanger",
      "thermal conductivity",
      "engineering calculations",
      "engineering",
      "calculator",
      "mechanics",
      "energy",
      "electricity"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "build",
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "mechanicalc",
    "name": "MechaniCalc",
    "url": "https://mechanicalc.com/",
    "description": "Engineering calculators that are also useful for civil/structural fundamentals such as beam deflection, stress, section properties, pressure, and mechanics.",
    "keywords": [
      "mechanical engineering",
      "stress",
      "strain",
      "beam",
      "shaft",
      "torsion",
      "bending",
      "pressure vessel",
      "fastener",
      "bolted joint",
      "springs",
      "machine design",
      "mechanics calculator",
      "beam calculator",
      "deflection",
      "section properties",
      "mechanics",
      "structural engineering",
      "civil engineering"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "calculate",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "mit-kinetic-art-mechanism-resources",
    "name": "MIT Kinetic Art / Mechanism Resources",
    "url": "https://ocw.mit.edu/search/?q=mechanism",
    "description": "MIT OpenCourseWare search landing for mechanism/mechanical-design course material that can complement interactive tools with theory and examples.",
    "keywords": [
      "mechanisms",
      "machine design",
      "kinematics",
      "dynamics",
      "mechanical engineering",
      "MIT",
      "lectures",
      "examples",
      "engineering theory"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "simulate",
      "practice",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "how-a-car-works",
    "name": "How a Car Works",
    "url": "https://www.howacarworks.com/",
    "description": "Visual and explanatory resource for understanding how car systems and components work, useful as a bridge between text and 3D/mechanical visualization.",
    "keywords": [
      "automotive",
      "car engine",
      "transmission",
      "clutch",
      "gearbox",
      "brakes",
      "suspension",
      "steering",
      "combustion engine",
      "drivetrain",
      "differential",
      "vehicle systems",
      "mechanical engineering"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "animagraffs",
    "name": "Animagraffs",
    "url": "https://animagraffs.com/",
    "description": "Particularly useful for animated visual explanations of internal combustion engines, transmissions, batteries, aircraft, and other complex machines.",
    "keywords": [
      "animation",
      "engineering animation",
      "engine",
      "car",
      "turbine",
      "battery",
      "aerospace",
      "mechanical systems",
      "how it works",
      "exploded animation",
      "visual explanation",
      "piston",
      "cylinder",
      "crankshaft",
      "connecting rod",
      "valve train",
      "combustion",
      "intake",
      "exhaust",
      "turbocharger",
      "gearbox",
      "differential",
      "transmission",
      "EV battery",
      "machine animation"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "electude",
    "name": "Electude",
    "url": "https://www.electude.com/",
    "description": "Automotive education platform with interactive lessons, diagnostic activities, simulations, and 3D representations of vehicle systems and components.",
    "keywords": [
      "automotive engineering",
      "car engine",
      "combustion",
      "drivetrain",
      "diagnostics",
      "engine components",
      "transmission",
      "vehicle electronics",
      "automotive systems",
      "3D engine",
      "mechanic training",
      "engine",
      "piston",
      "crankshaft",
      "camshaft",
      "valves",
      "combustion engine",
      "automotive electronics",
      "vehicle systems",
      "engine cycle",
      "mechanic",
      "automotive training"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d",
      "simulate",
      "practice"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "sketchfab-automotive-models",
    "name": "Sketchfab \u2014 Automotive Models",
    "url": "https://sketchfab.com/tags/car",
    "description": "Interactive browser-viewable 3D models for cars, engines, components, mechanisms, and vehicle systems.",
    "keywords": [
      "car",
      "automobile",
      "engine",
      "gearbox",
      "transmission",
      "suspension",
      "brake",
      "wheel",
      "chassis",
      "vehicle",
      "automotive",
      "3D model",
      "interactive 3D"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "explore-3d"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "structurecalcs",
    "name": "StructureCalcs",
    "url": "https://structurecalcs.com/",
    "description": "Browser-based structural tools for beams, trusses, frames, sections, and report generation.",
    "keywords": [
      "structural engineering",
      "beam",
      "truss",
      "frame",
      "shear force",
      "bending moment",
      "deflection",
      "section properties",
      "centroid",
      "moment of inertia",
      "structural analysis",
      "load",
      "reaction",
      "civil engineering"
    ],
    "domains": [
      "civil"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "civilaxis-3d-structural-analysis",
    "name": "CivilAxis \u2014 3D Structural Analysis",
    "url": "https://civilaxis.com/structural-analysis-3d",
    "description": "Interactive browser-based 3D frame and truss analysis tool with nodes, members, supports, loads, reactions, internal forces, and deflected shape.",
    "keywords": [
      "structural analysis",
      "3D frame",
      "space truss",
      "truss",
      "beam",
      "frame",
      "node",
      "load",
      "support",
      "reaction",
      "axial force",
      "shear",
      "torsion",
      "bending moment",
      "deflection",
      "civil engineering",
      "matrix stiffness"
    ],
    "domains": [
      "civil"
    ],
    "learningModes": [
      "explore-3d"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "skyciv",
    "name": "SkyCiv",
    "url": "https://skyciv.com/",
    "description": "Cloud structural-engineering suite for beams, frames, trusses, connections, sections, loads, and structural analysis workflows.",
    "keywords": [
      "civil engineering",
      "structural analysis",
      "beam calculator",
      "truss",
      "frame",
      "steel design",
      "concrete",
      "loads",
      "support reactions",
      "bending moment",
      "shear force",
      "deflection",
      "section properties",
      "3D structural analysis"
    ],
    "domains": [
      "civil"
    ],
    "learningModes": [
      "explore-3d",
      "calculate",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "structx",
    "name": "StructX",
    "url": "https://structx.com/",
    "description": "Structural engineering reference and calculator resource covering loads, sections, materials, steel, concrete, timber, and structural analysis topics.",
    "keywords": [
      "structural engineering",
      "beam",
      "column",
      "loads",
      "steel",
      "concrete",
      "timber",
      "section properties",
      "stress",
      "deflection",
      "civil engineering calculator"
    ],
    "domains": [
      "civil"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "civil-engineering-calculators",
    "name": "Civil Engineering Calculators",
    "url": "https://www.civil-engineering-calculators.com/",
    "description": "Collection of civil engineering calculators covering common structural, geotechnical, hydrology, and construction calculations.",
    "keywords": [
      "civil engineering",
      "structural calculator",
      "concrete",
      "steel",
      "beam",
      "footing",
      "column",
      "retaining wall",
      "soil",
      "hydrology",
      "construction",
      "engineering calculations"
    ],
    "domains": [
      "civil"
    ],
    "learningModes": [
      "build",
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "calcresource",
    "name": "CalcResource",
    "url": "https://calcresource.com/",
    "description": "Clean engineering and mathematics reference/calculator site covering mechanics, fluid mechanics, structural topics, math, and technical formulas.",
    "keywords": [
      "engineering calculator",
      "mechanics",
      "structures",
      "fluid mechanics",
      "thermodynamics",
      "mathematics",
      "stress",
      "beam",
      "section properties",
      "formulas",
      "reference"
    ],
    "domains": [
      "civil"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "sketchup",
    "name": "SketchUp",
    "url": "https://www.sketchup.com/",
    "description": "Accessible 3D modeling tool widely used for architecture, built environment visualization, concept modeling, and spatial studies.",
    "keywords": [
      "architecture",
      "3D modeling",
      "buildings",
      "BIM",
      "civil",
      "construction",
      "floor plan",
      "massing",
      "spatial design",
      "structure visualization",
      "building model"
    ],
    "domains": [
      "architecture",
      "civil"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "build",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "autodesk-revit",
    "name": "Autodesk Revit",
    "url": "https://www.autodesk.com/products/revit/overview",
    "description": "BIM platform for architecture, structural engineering, MEP, documentation, building systems, and coordinated building models.",
    "keywords": [
      "BIM",
      "Revit",
      "architecture",
      "structural engineering",
      "MEP",
      "building information modeling",
      "walls",
      "slabs",
      "columns",
      "beams",
      "families",
      "floor plan",
      "section",
      "construction documentation"
    ],
    "domains": [
      "architecture",
      "civil"
    ],
    "learningModes": [
      "explore-3d",
      "build",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "autodesk-infraworks",
    "name": "Autodesk InfraWorks",
    "url": "https://www.autodesk.com/products/infraworks/overview",
    "description": "Infrastructure planning and visualization platform for roads, bridges, terrain, and broader civil-infrastructure concepts.",
    "keywords": [
      "civil engineering",
      "infrastructure",
      "roads",
      "bridges",
      "terrain",
      "transportation",
      "urban planning",
      "site design",
      "infrastructure visualization",
      "GIS",
      "BIM"
    ],
    "domains": [
      "architecture",
      "civil"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "cadmapper",
    "name": "CADMAPPER",
    "url": "https://cadmapper.com/",
    "description": "Generates CAD-ready maps and 3D context from geographic/open-map data for site modeling and urban/architectural work.",
    "keywords": [
      "civil engineering",
      "architecture",
      "GIS",
      "CAD",
      "site modeling",
      "urban planning",
      "roads",
      "buildings",
      "terrain",
      "maps",
      "OpenStreetMap",
      "DXF",
      "3D context"
    ],
    "domains": [
      "architecture",
      "civil"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "build",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "cesium",
    "name": "Cesium",
    "url": "https://cesium.com/platform/cesiumjs/",
    "description": "3D geospatial visualization platform for globe-scale terrain, buildings, imagery, maps, infrastructure, and spatial data.",
    "keywords": [
      "GIS",
      "3D globe",
      "terrain",
      "buildings",
      "geospatial",
      "civil engineering",
      "infrastructure",
      "satellite imagery",
      "coordinates",
      "mapping",
      "visualization",
      "digital twin"
    ],
    "domains": [
      "architecture",
      "civil"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "build"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "openstreetmap",
    "name": "OpenStreetMap",
    "url": "https://www.openstreetmap.org/",
    "description": "Open geographic database useful for maps, roads, buildings, land use, infrastructure, and geographic context.",
    "keywords": [
      "GIS",
      "mapping",
      "roads",
      "buildings",
      "infrastructure",
      "geography",
      "surveying",
      "civil engineering",
      "land use",
      "coordinates",
      "geospatial data",
      "OpenStreetMap"
    ],
    "domains": [
      "earth-science",
      "geography"
    ],
    "learningModes": [
      "visualize",
      "build"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "opentopography",
    "name": "OpenTopography",
    "url": "https://opentopography.org/",
    "description": "Platform for high-resolution topographic and 3D elevation data, especially useful for terrain and geoscience work.",
    "keywords": [
      "topography",
      "terrain",
      "elevation",
      "LiDAR",
      "point cloud",
      "DEM",
      "digital elevation model",
      "GIS",
      "civil engineering",
      "surveying",
      "geomatics",
      "geoscience"
    ],
    "domains": [
      "earth-science",
      "geography"
    ],
    "learningModes": [
      "explore-3d",
      "visualize"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "usgs-3d-elevation-program",
    "name": "USGS 3D Elevation Program",
    "url": "https://www.usgs.gov/3d-elevation-program",
    "description": "U.S. national elevation-data program providing terrain/elevation resources useful for geospatial and civil applications.",
    "keywords": [
      "terrain",
      "elevation",
      "DEM",
      "LiDAR",
      "topography",
      "GIS",
      "surveying",
      "civil engineering",
      "geography",
      "geospatial data",
      "hydrology"
    ],
    "domains": [
      "earth-science",
      "geography"
    ],
    "learningModes": [
      "explore-3d",
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "nasa-worldview",
    "name": "NASA Worldview",
    "url": "https://worldview.earthdata.nasa.gov/",
    "description": "Interactive satellite and Earth-observation viewer for exploring imagery and environmental data over time.",
    "keywords": [
      "satellite imagery",
      "Earth observation",
      "remote sensing",
      "climate",
      "weather",
      "geography",
      "GIS",
      "vegetation",
      "fires",
      "floods",
      "atmosphere",
      "civil engineering",
      "environmental engineering"
    ],
    "domains": [
      "earth-science",
      "geography"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "earth-nullschool",
    "name": "Earth Nullschool",
    "url": "https://earth.nullschool.net/",
    "description": "Animated global visualization of wind, pressure, ocean currents, waves, temperature, atmospheric chemistry, and related environmental systems.",
    "keywords": [
      "wind",
      "atmosphere",
      "weather",
      "climate",
      "ocean currents",
      "waves",
      "temperature",
      "pressure",
      "meteorology",
      "environmental engineering",
      "fluid dynamics",
      "Earth science",
      "GIS"
    ],
    "domains": [
      "earth-science",
      "geography"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "openrailwaymap",
    "name": "OpenRailwayMap",
    "url": "https://www.openrailwaymap.org/",
    "description": "Interactive map of railway infrastructure and track information based on OpenStreetMap data.",
    "keywords": [
      "railway engineering",
      "railways",
      "tracks",
      "civil engineering",
      "transportation engineering",
      "signaling",
      "rail infrastructure",
      "GIS",
      "mapping"
    ],
    "domains": [
      "earth-science",
      "geography"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "simscale",
    "name": "SimScale",
    "url": "https://www.simscale.com/",
    "description": "Cloud engineering simulation platform for CFD, structural analysis, thermal analysis, and multiphysics workflows.",
    "keywords": [
      "CFD",
      "computational fluid dynamics",
      "FEA",
      "finite element analysis",
      "fluid flow",
      "heat transfer",
      "turbulence",
      "pressure",
      "velocity",
      "thermal analysis",
      "structural simulation",
      "engineering simulation"
    ],
    "domains": [
      "mechanical",
      "physics"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "openfoam",
    "name": "OpenFOAM",
    "url": "https://www.openfoam.com/",
    "description": "Open-source CFD software ecosystem used for fluid flow, heat transfer, multiphase flows, turbulence, and engineering simulation.",
    "keywords": [
      "CFD",
      "OpenFOAM",
      "fluid mechanics",
      "Navier Stokes",
      "turbulence",
      "boundary layer",
      "pressure",
      "velocity",
      "heat transfer",
      "multiphase flow",
      "aerodynamics",
      "simulation"
    ],
    "domains": [
      "mechanical",
      "physics"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "comsol",
    "name": "COMSOL",
    "url": "https://www.comsol.com/",
    "description": "Multiphysics simulation platform spanning heat transfer, electromagnetics, structural mechanics, CFD, acoustics, and coupled physical systems.",
    "keywords": [
      "multiphysics",
      "FEA",
      "CFD",
      "electromagnetics",
      "heat transfer",
      "structural mechanics",
      "acoustics",
      "coupled physics",
      "simulation",
      "engineering"
    ],
    "domains": [
      "mechanical",
      "physics"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "ansys-student",
    "name": "ANSYS Student",
    "url": "https://www.ansys.com/academic/students",
    "description": "Student-oriented Ansys access and resources covering structural analysis, CFD, electromagnetics, thermal simulation, and multiphysics.",
    "keywords": [
      "ANSYS",
      "FEA",
      "CFD",
      "Fluent",
      "structural analysis",
      "thermal analysis",
      "electromagnetics",
      "finite element",
      "finite volume",
      "engineering simulation",
      "stress",
      "strain",
      "fluid flow"
    ],
    "domains": [
      "mechanical",
      "physics"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "myengineeringtools",
    "name": "MyEngineeringTools",
    "url": "https://myengineeringtools.com/",
    "description": "Collection of engineering calculators and technical tools covering mechanics, thermodynamics, fluids, electrical topics, and common engineering conversions.",
    "keywords": [
      "engineering calculator",
      "fluids",
      "heat transfer",
      "thermodynamics",
      "mechanics",
      "electrical",
      "unit conversion",
      "pressure",
      "flow",
      "stress",
      "thermal engineering"
    ],
    "domains": [
      "mechanical",
      "physics"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "openvsp",
    "name": "OpenVSP",
    "url": "https://openvsp.org/",
    "description": "NASA-developed parametric aircraft geometry tool for quickly creating and analyzing conceptual aircraft designs.",
    "keywords": [
      "aerospace",
      "aircraft design",
      "aerodynamic geometry",
      "fuselage",
      "wing",
      "tail",
      "nacelle",
      "propeller",
      "conceptual design",
      "VSPAERO",
      "3D aircraft",
      "aircraft configuration"
    ],
    "domains": [
      "aerospace"
    ],
    "learningModes": [
      "explore-3d",
      "build",
      "design"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "xflr5",
    "name": "XFLR5",
    "url": "https://www.xflr5.net/",
    "description": "Analysis tool focused on airfoils, wings, stability, and low-Reynolds-number aerodynamic design.",
    "keywords": [
      "aerodynamics",
      "airfoil",
      "wing",
      "lift",
      "drag",
      "Reynolds number",
      "stability",
      "aircraft design",
      "XFOIL",
      "aerodynamic analysis",
      "low Reynolds number"
    ],
    "domains": [
      "aerospace"
    ],
    "learningModes": [
      "design"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "avl-athena-vortex-lattice",
    "name": "AVL \u2014 Athena Vortex Lattice",
    "url": "https://web.mit.edu/drela/Public/web/avl/",
    "description": "MIT-developed aerodynamic analysis program for aircraft configuration, stability derivatives, trim, and control analysis.",
    "keywords": [
      "aerospace",
      "aerodynamics",
      "vortex lattice",
      "stability derivatives",
      "trim",
      "control surfaces",
      "aircraft dynamics",
      "lift",
      "drag",
      "moments",
      "wing",
      "tail"
    ],
    "domains": [
      "aerospace"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "nasa-cea",
    "name": "NASA CEA",
    "url": "https://cearun.grc.nasa.gov/",
    "description": "NASA Chemical Equilibrium with Applications tool for combustion, rocket propulsion, thermochemistry, and performance calculations.",
    "keywords": [
      "propulsion",
      "rocket",
      "combustion",
      "thermochemistry",
      "equilibrium",
      "nozzle",
      "specific impulse",
      "chamber pressure",
      "exhaust velocity",
      "aerospace",
      "chemical equilibrium"
    ],
    "domains": [
      "aerospace"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "gmat-general-mission-analysis-tool",
    "name": "GMAT \u2014 General Mission Analysis Tool",
    "url": "https://gmat.atlassian.net/wiki/spaces/GW/overview",
    "description": "Mission-design and orbital-analysis software for spacecraft trajectories, orbit propagation, maneuvers, and mission planning.",
    "keywords": [
      "orbital mechanics",
      "spacecraft",
      "trajectory",
      "orbit",
      "Hohmann transfer",
      "delta-v",
      "maneuver",
      "propagation",
      "astrodynamics",
      "mission design",
      "aerospace"
    ],
    "domains": [
      "aerospace"
    ],
    "learningModes": [
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "jsbsim",
    "name": "JSBSim",
    "url": "https://jsbsim-team.github.io/jsbsim/",
    "description": "Open-source flight dynamics model for simulating aircraft motion, forces, controls, and flight behavior.",
    "keywords": [
      "flight dynamics",
      "aircraft simulation",
      "aerodynamics",
      "control systems",
      "propulsion",
      "forces",
      "moments",
      "stability",
      "aircraft model",
      "aerospace engineering"
    ],
    "domains": [
      "aerospace"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "flightgear",
    "name": "FlightGear",
    "url": "https://www.flightgear.org/",
    "description": "Open-source flight simulator useful for exploring aircraft behavior, flight dynamics, navigation, and aviation systems.",
    "keywords": [
      "flight simulator",
      "aircraft",
      "aviation",
      "flight dynamics",
      "aerodynamics",
      "navigation",
      "cockpit",
      "aircraft systems",
      "aerospace engineering"
    ],
    "domains": [
      "aerospace"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "geofs",
    "name": "GeoFS",
    "url": "https://www.geo-fs.com/",
    "description": "Browser-based flight simulator with a global map and interactive aircraft controls, useful for intuitive exploration of aviation concepts.",
    "keywords": [
      "flight simulator",
      "aviation",
      "aircraft",
      "navigation",
      "altitude",
      "heading",
      "airspeed",
      "flight controls",
      "geography",
      "aerospace",
      "flight training"
    ],
    "domains": [
      "aerospace"
    ],
    "learningModes": [
      "simulate",
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "robodk",
    "name": "RoboDK",
    "url": "https://robodk.com/",
    "description": "Robot programming and simulation environment for industrial robots, trajectories, cells, tooling, and offline programming.",
    "keywords": [
      "robotics",
      "industrial robot",
      "robot arm",
      "kinematics",
      "inverse kinematics",
      "trajectory planning",
      "robot simulation",
      "end effector",
      "automation",
      "manufacturing"
    ],
    "domains": [
      "computer-science",
      "electronics"
    ],
    "learningModes": [
      "simulate",
      "run-code"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "webots",
    "name": "Webots",
    "url": "https://cyberbotics.com/",
    "description": "Robotics simulation environment for modeling robots, sensors, actuators, environments, and autonomous systems.",
    "keywords": [
      "robotics",
      "robot simulation",
      "sensors",
      "actuators",
      "lidar",
      "camera",
      "mobile robot",
      "robot arm",
      "kinematics",
      "dynamics",
      "autonomous systems",
      "control"
    ],
    "domains": [
      "computer-science",
      "electronics"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "gazebo",
    "name": "Gazebo",
    "url": "https://gazebosim.org/",
    "description": "Open robotics simulation ecosystem for physics-based robot and mechanism simulation with sensors and environments.",
    "keywords": [
      "robotics",
      "Gazebo",
      "ROS",
      "robot simulation",
      "physics engine",
      "sensor simulation",
      "dynamics",
      "kinematics",
      "mobile robot",
      "manipulator",
      "autonomous systems"
    ],
    "domains": [
      "computer-science",
      "electronics"
    ],
    "learningModes": [
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "control-systems-academy",
    "name": "Control Systems Academy",
    "url": "https://www.controlsystemsacademy.com/",
    "description": "Control-systems learning resource with explanations, examples, and practical material for feedback and system modeling.",
    "keywords": [
      "control systems",
      "feedback",
      "PID",
      "transfer function",
      "poles",
      "zeros",
      "stability",
      "root locus",
      "Bode plot",
      "Nyquist",
      "state space",
      "control engineering"
    ],
    "domains": [
      "computer-science",
      "electronics"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "design"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "matlab-online",
    "name": "MATLAB Online",
    "url": "https://matlab.mathworks.com/",
    "description": "Browser-accessible MATLAB environment for numerical computing, signal processing, controls, simulation, and engineering analysis.",
    "keywords": [
      "MATLAB",
      "numerical computing",
      "matrix",
      "signal processing",
      "control systems",
      "Simulink",
      "engineering math",
      "plotting",
      "DSP",
      "simulation",
      "linear algebra"
    ],
    "domains": [
      "computer-science",
      "electronics"
    ],
    "learningModes": [
      "simulate",
      "visualize"
    ],
    "featured": false,
    "popular": true
  },
  {
    "id": "molview",
    "name": "MolView",
    "url": "https://molview.org/",
    "description": "Browser-based molecular visualization tool that converts chemical structures into interactive 3D views and connects to chemical databases.",
    "keywords": [
      "chemistry",
      "molecule",
      "molecular structure",
      "2D structure",
      "3D molecule",
      "bonds",
      "geometry",
      "stereochemistry",
      "organic chemistry",
      "molecular visualization",
      "SMILES",
      "PubChem"
    ],
    "domains": [
      "chemistry"
    ],
    "learningModes": [
      "explore-3d",
      "visualize"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "A 2D formula cannot show bond geometry the way a rotatable 3D molecule can."
  },
  {
    "id": "pubchem",
    "name": "PubChem",
    "url": "https://pubchem.ncbi.nlm.nih.gov/",
    "description": "NIH chemical information resource with searchable compounds, structures, properties, and interactive molecular views.",
    "keywords": [
      "chemistry",
      "compounds",
      "molecular structure",
      "3D structure",
      "chemical properties",
      "formula",
      "molecular weight",
      "PubChem",
      "drug chemistry",
      "organic chemistry",
      "spectroscopy"
    ],
    "domains": [
      "chemistry"
    ],
    "learningModes": [
      "explore-3d",
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "rcsb-protein-data-bank",
    "name": "RCSB Protein Data Bank",
    "url": "https://www.rcsb.org/",
    "description": "Repository of experimentally determined 3D structures of proteins, nucleic acids, and complexes with interactive molecular viewers.",
    "keywords": [
      "protein",
      "biomolecule",
      "3D structure",
      "molecular biology",
      "structural biology",
      "PDB",
      "protein folding",
      "ligand",
      "enzyme",
      "DNA",
      "RNA",
      "molecular visualization"
    ],
    "domains": [
      "chemistry"
    ],
    "learningModes": [
      "explore-3d",
      "visualize",
      "experiment"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "chemcollective",
    "name": "ChemCollective",
    "url": "https://chemcollective.org/",
    "description": "Virtual chemistry lab ecosystem with interactive experiments, problem sets, and virtual lab environments.",
    "keywords": [
      "chemistry",
      "virtual lab",
      "stoichiometry",
      "titration",
      "equilibrium",
      "acids and bases",
      "thermochemistry",
      "solutions",
      "molarity",
      "chemical reactions",
      "lab simulation"
    ],
    "domains": [
      "chemistry"
    ],
    "learningModes": [
      "simulate",
      "experiment"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "phet-chemistry",
    "name": "PhET Chemistry",
    "url": "https://phet.colorado.edu/en/simulations/filter?subjects=chemistry",
    "description": "Collection of interactive chemistry simulations covering atoms, molecules, concentration, reactions, gases, pH, and other core chemistry concepts.",
    "keywords": [
      "chemistry",
      "atom",
      "molecule",
      "pH",
      "concentration",
      "molarity",
      "gas laws",
      "reactions",
      "balancing equations",
      "equilibrium",
      "solutions",
      "chemistry simulation"
    ],
    "domains": [
      "chemistry"
    ],
    "learningModes": [
      "explore-3d",
      "simulate",
      "calculate"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "matweb",
    "name": "MatWeb",
    "url": "https://www.matweb.com/",
    "description": "Materials-property database covering metals, plastics, composites, ceramics, and engineering materials.",
    "keywords": [
      "materials science",
      "material properties",
      "tensile strength",
      "yield strength",
      "modulus",
      "density",
      "hardness",
      "thermal conductivity",
      "steel",
      "aluminum",
      "polymers",
      "composites",
      "engineering materials"
    ],
    "domains": [
      "chemistry"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "makeitfrom",
    "name": "MakeItFrom",
    "url": "https://www.makeitfrom.com/",
    "description": "Materials database focused on mechanical, thermal, physical, and comparative properties of engineering materials.",
    "keywords": [
      "materials",
      "material properties",
      "mechanical properties",
      "thermal properties",
      "steel",
      "aluminum",
      "titanium",
      "plastic",
      "composite",
      "Young modulus",
      "yield strength",
      "density",
      "heat treatment"
    ],
    "domains": [
      "chemistry"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "biodigital-human",
    "name": "BioDigital Human",
    "url": "https://www.biodigital.com/",
    "description": "Interactive 3D human body platform for exploring anatomy, conditions, organs, systems, and medical concepts.",
    "keywords": [
      "anatomy",
      "human body",
      "organ",
      "muscle",
      "bone",
      "nervous system",
      "cardiovascular system",
      "respiratory system",
      "3D anatomy",
      "medicine",
      "physiology",
      "pathology"
    ],
    "domains": [
      "biology",
      "medicine"
    ],
    "learningModes": [
      "explore-3d"
    ],
    "featured": true,
    "popular": true,
    "recommendation": "Anatomy is spatial; rotating and isolating structures beats a labeled figure."
  },
  {
    "id": "anatomy-learning",
    "name": "Anatomy Learning",
    "url": "https://anatomylearning.com/",
    "description": "Interactive 3D anatomy environment for rotating, isolating, labeling, and learning human structures.",
    "keywords": [
      "anatomy",
      "3D anatomy",
      "skeleton",
      "muscles",
      "bones",
      "joints",
      "organs",
      "human body",
      "physiology",
      "medical education",
      "anatomy quiz"
    ],
    "domains": [
      "biology",
      "medicine"
    ],
    "learningModes": [
      "explore-3d",
      "practice"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "visible-body",
    "name": "Visible Body",
    "url": "https://www.visiblebody.com/",
    "description": "3D anatomy platform with detailed models of the human body and systems.",
    "keywords": [
      "anatomy",
      "physiology",
      "human body",
      "3D model",
      "skeleton",
      "muscle",
      "organ",
      "nervous system",
      "cardiovascular",
      "medical education"
    ],
    "domains": [
      "biology",
      "medicine"
    ],
    "learningModes": [
      "explore-3d"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "hhmi-biointeractive",
    "name": "HHMI BioInteractive",
    "url": "https://www.biointeractive.org/",
    "description": "High-quality interactive biology resources, virtual labs, datasets, animations, and activities for genetics, evolution, ecology, physiology, and more.",
    "keywords": [
      "biology",
      "genetics",
      "evolution",
      "ecology",
      "physiology",
      "virtual lab",
      "natural selection",
      "immune system",
      "DNA",
      "gene regulation",
      "population biology",
      "biology simulation"
    ],
    "domains": [
      "biology",
      "medicine"
    ],
    "learningModes": [
      "simulate",
      "visualize",
      "experiment"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "learn-genetics-virtual-labs",
    "name": "Learn.Genetics Virtual Labs",
    "url": "https://learn.genetics.utah.edu/content/labs/",
    "description": "Interactive genetics labs and activities including DNA extraction, PCR, gel electrophoresis, flow cytometry, and microarrays.",
    "keywords": [
      "genetics",
      "DNA",
      "PCR",
      "gel electrophoresis",
      "DNA extraction",
      "microarray",
      "flow cytometry",
      "molecular biology",
      "biotechnology",
      "virtual lab",
      "genetics experiment"
    ],
    "domains": [
      "biology",
      "medicine"
    ],
    "learningModes": [
      "explore-3d",
      "simulate",
      "experiment"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "zygote-body",
    "name": "Zygote Body",
    "url": "https://www.zygotebody.com/",
    "description": "Web-based 3D human anatomy viewer for exploring body structures and systems.",
    "keywords": [
      "anatomy",
      "3D body",
      "muscles",
      "skeleton",
      "organs",
      "human anatomy",
      "medical visualization",
      "physiology"
    ],
    "domains": [
      "biology",
      "medicine"
    ],
    "learningModes": [
      "explore-3d",
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "nasa-eyes",
    "name": "NASA Eyes",
    "url": "https://eyes.nasa.gov/",
    "description": "Interactive 3D experiences based on NASA data for exploring spacecraft, planets, missions, asteroids, Earth, and the solar system.",
    "keywords": [
      "astronomy",
      "NASA",
      "space",
      "solar system",
      "planets",
      "spacecraft",
      "mission",
      "orbital mechanics",
      "asteroid",
      "Earth",
      "Mars",
      "Moon",
      "satellite",
      "3D visualization"
    ],
    "domains": [
      "astronomy",
      "earth-science"
    ],
    "learningModes": [
      "explore-3d",
      "visualize"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "stellarium-web",
    "name": "Stellarium Web",
    "url": "https://stellarium-web.org/",
    "description": "Browser planetarium for exploring stars, constellations, planets, sky coordinates, and the night sky.",
    "keywords": [
      "astronomy",
      "stars",
      "constellations",
      "planets",
      "sky map",
      "celestial sphere",
      "right ascension",
      "declination",
      "astrophysics",
      "night sky",
      "telescope"
    ],
    "domains": [
      "astronomy",
      "earth-science"
    ],
    "learningModes": [
      "explore-3d",
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "solar-system-scope",
    "name": "Solar System Scope",
    "url": "https://www.solarsystemscope.com/",
    "description": "Interactive 3D model of the solar system for exploring planets, orbits, distances, and celestial relationships.",
    "keywords": [
      "solar system",
      "planets",
      "orbit",
      "astronomy",
      "Earth",
      "Moon",
      "Sun",
      "scale",
      "celestial mechanics",
      "3D astronomy"
    ],
    "domains": [
      "astronomy",
      "earth-science"
    ],
    "learningModes": [
      "explore-3d"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "celestia",
    "name": "Celestia",
    "url": "https://celestia.space/",
    "description": "Space simulation environment for exploring a 3D representation of the universe and celestial bodies.",
    "keywords": [
      "astronomy",
      "space simulation",
      "planets",
      "stars",
      "galaxies",
      "orbit",
      "3D universe",
      "celestial bodies"
    ],
    "domains": [
      "astronomy",
      "earth-science"
    ],
    "learningModes": [
      "explore-3d",
      "simulate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "webplotdigitizer",
    "name": "WebPlotDigitizer",
    "url": "https://automeris.io/WebPlotDigitizer/",
    "description": "Extracts numerical data from plots and graphs by interactively digitizing points, curves, bars, and maps.",
    "keywords": [
      "graph digitization",
      "plot digitizer",
      "engineering data",
      "scientific data",
      "curve extraction",
      "experiment data",
      "chart analysis",
      "data extraction",
      "research",
      "measurement"
    ],
    "domains": [
      "mathematics",
      "computer-science"
    ],
    "learningModes": [
      "visualize",
      "experiment"
    ],
    "featured": true,
    "popular": true
  },
  {
    "id": "observable",
    "name": "Observable",
    "url": "https://observablehq.com/",
    "description": "Interactive notebook environment for data visualization, JavaScript, maps, simulations, and computational storytelling.",
    "keywords": [
      "data visualization",
      "JavaScript",
      "notebooks",
      "charts",
      "simulation",
      "maps",
      "D3",
      "interactive graphics",
      "data science",
      "visualization"
    ],
    "domains": [
      "mathematics",
      "computer-science"
    ],
    "learningModes": [
      "simulate",
      "visualize",
      "run-code"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "engineers-edge",
    "name": "Engineers Edge",
    "url": "https://www.engineersedge.com/",
    "description": "Engineering reference and calculator site covering mechanical, manufacturing, materials, fluid, thermal, and general engineering formulas.",
    "keywords": [
      "engineering formulas",
      "calculator",
      "mechanical engineering",
      "materials",
      "stress",
      "strain",
      "beam",
      "fluid mechanics",
      "heat transfer",
      "manufacturing",
      "tolerances",
      "units"
    ],
    "domains": [
      "general-stem"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "fractory",
    "name": "Fractory",
    "url": "https://fractory.com/",
    "description": "Manufacturing and materials resource with engineering references, manufacturing-process explanations, and practical engineering calculators/content.",
    "keywords": [
      "manufacturing",
      "machining",
      "welding",
      "sheet metal",
      "materials",
      "steel",
      "aluminum",
      "CNC",
      "fabrication",
      "engineering",
      "cost",
      "process selection",
      "production"
    ],
    "domains": [
      "general-stem"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "omni-calculator-engineering",
    "name": "Omni Calculator \u2014 Engineering",
    "url": "https://www.omnicalculator.com/engineering",
    "description": "Large collection of quick calculators across mechanics, structural engineering, electrical, thermal, geometry, fluids, and general engineering.",
    "keywords": [
      "engineering calculator",
      "mechanics",
      "electrical",
      "civil",
      "mechanical",
      "thermodynamics",
      "fluid mechanics",
      "beam",
      "stress",
      "power",
      "units",
      "conversion",
      "quick calculation"
    ],
    "domains": [
      "general-stem"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "wolfram-demonstrations",
    "name": "Wolfram Demonstrations",
    "url": "https://demonstrations.wolfram.com/",
    "description": "Huge archive of interactive mathematical/scientific demonstrations covering physics, engineering, chemistry, math, and many specialist topics.",
    "keywords": [
      "interactive math",
      "physics",
      "engineering",
      "demonstrations",
      "simulation",
      "visualization",
      "calculus",
      "mechanics",
      "thermodynamics",
      "chemistry",
      "control systems",
      "interactive demonstration",
      "math",
      "science",
      "experiment",
      "parameter exploration"
    ],
    "domains": [
      "general-stem"
    ],
    "learningModes": [
      "simulate",
      "visualize",
      "experiment"
    ],
    "featured": false,
    "popular": true
  },
  {
    "id": "harvey-tool",
    "name": "Harvey Tool",
    "url": "https://www.harveytool.com/",
    "description": "Manufacturer engineering site with technical information and machining resources around cutters, feeds, speeds, and tool geometry.",
    "keywords": [
      "machining",
      "milling",
      "cutting tools",
      "end mill",
      "feeds",
      "speeds",
      "tool geometry",
      "CNC",
      "manufacturing",
      "CAM"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "visualize"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "machining-doctor",
    "name": "Machining Doctor",
    "url": "https://www.machiningdoctor.com/",
    "description": "Practical machining reference and calculators for cutting conditions, tooling, materials, and CNC-related decisions.",
    "keywords": [
      "machining",
      "feeds and speeds",
      "cutting speed",
      "spindle speed",
      "chip load",
      "CNC",
      "end mill",
      "turning",
      "milling",
      "tool life",
      "manufacturing"
    ],
    "domains": [
      "mechanical"
    ],
    "learningModes": [
      "calculate"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "learn-anything",
    "name": "Learn Anything",
    "url": "https://learn-anything.xyz/",
    "description": "Knowledge-map style discovery interface for exploring subjects and related concepts rather than following a single linear course.",
    "keywords": [
      "knowledge graph",
      "concept map",
      "learning path",
      "topic exploration",
      "computer science",
      "mathematics",
      "science",
      "prerequisites",
      "curriculum discovery"
    ],
    "domains": [
      "general-stem"
    ],
    "learningModes": [
      "visualize",
      "practice"
    ],
    "featured": false,
    "popular": false
  },
  {
    "id": "cs50-shorts-visual-resources",
    "name": "CS50 Shorts / Visual Resources",
    "url": "https://cs50.harvard.edu/x/",
    "description": "Structured computer-science learning with visual explanations and hands-on programming exercises. Useful when LUMA identifies a concept that needs guided coding practice.",
    "keywords": [
      "computer science",
      "programming",
      "C",
      "Python",
      "SQL",
      "algorithms",
      "memory",
      "pointers",
      "data structures",
      "web development",
      "coding practice"
    ],
    "domains": [
      "general-stem"
    ],
    "learningModes": [
      "visualize",
      "run-code",
      "practice"
    ],
    "featured": false,
    "popular": false
  }
] satisfies LearningTool[]

