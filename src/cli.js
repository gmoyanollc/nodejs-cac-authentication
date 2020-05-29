// [JavaScript Factory Functions vs Constructor Functions vs Classes](https://medium.com/javascript-scene/javascript-factory-functions-vs-constructor-functions-vs-classes-2f22ceddf33e)
const cliFactory = () => {
//(() => {
  const argv = process.argv
  switch (argv[2].substr(0,4)) {
    case "http": {
      break
    }
    case "--he": {
    }
    default: {
      console.log(`[INFO] syntax: ${argv[0].substr(argv[0].lastIndexOf('/') + 1)} ${argv[1].substr(argv[1].lastIndexOf('/') + 1)} url`)
      process.exit(1)
    }
  }
  return {
    getScriptArgs: () => argv.slice(2),
    getScriptName: () => argv[1],
    getScriptUrl: () => argv[2]
  }
}

module.exports = { cliFactory }