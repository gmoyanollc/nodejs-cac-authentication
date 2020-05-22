const tls = require('tls');
const inquirer = require("inquirer");
var graphene = require("graphene-pk11");
var Module = graphene.Module;

var mod = Module.load("/lib64/pkcs11/opensc-pkcs11.so", "opensc");

const TlsOptions = () => {
  let options = {
    ca:   "",
    cert: "",
    key:  "",
    host: "",
    port: 8000,
    rejectUnauthorized:true,
    requestCert:true
  };
  return {
    getTlsOptions: () => options,
    setCa: (ca) => { options.ca = ca },
    setCert: (cert) => { options.cert = cert },
    setKey: (key) => { options.key = key },
    setHost: (host) => { options.host = host },
  }
}

const ScReader = () => {
  let slots

  function printProperties () {
    //[Listing capabilities](https://www.npmjs.com/package/graphene-pk11)
    const slotPrintDelimiter = "////////////////////////////////////////////////////////////"  // +g

    for (var i = 0; i < slots.length; i++) {
      var slot = slots.items(i);
      console.log(slotPrintDelimiter)
      console.log("Slot #", i) // +g
      console.log("Slot Handle #" + slot.handle);
      console.log("\tDescription:", slot.slotDescription);
      console.log("\tSerial:", slot.getToken().serialNumber);
      console.log(
        "\tPassword(min/max): %d/%d",
        slot.getToken().minPinLen,
        slot.getToken().maxPinLen
      );
      console.log("\tIs hardware:", !!(slot.flags & graphene.SlotFlag.HW_SLOT));
      console.log(
        "\tIs removable:",
        !!(slot.flags & graphene.SlotFlag.REMOVABLE_DEVICE)
      );
      console.log(
        "\tIs initialized:",
        !!(slot.flags & graphene.SlotFlag.TOKEN_PRESENT)
      );
      console.log("\n\nMechanisms:");
      console.log("Name                       h/s/v/e/d/w/u");
      console.log("========================================");
      function b(v) {
        return v ? "+" : "-";
      }
  
      function s(v) {
        v = v.toString();
        for (var i_1 = v.length; i_1 < 27; i_1++) {
          v += " ";
        }
        return v;
      }
  
      var mechs = slot.getMechanisms();
      for (var j = 0; j < mechs.length; j++) {
        var mech = mechs.items(j);
        console.log(
          s(mech.name) +
            b(mech.flags & graphene.MechanismFlag.DIGEST) +
            "/" +
            b(mech.flags & graphene.MechanismFlag.SIGN) +
            "/" +
            b(mech.flags & graphene.MechanismFlag.VERIFY) +
            "/" +
            b(mech.flags & graphene.MechanismFlag.ENCRYPT) +
            "/" +
            b(mech.flags & graphene.MechanismFlag.DECRYPT) +
            "/" +
            b(mech.flags & graphene.MechanismFlag.WRAP) +
            "/" +
            b(mech.flags & graphene.MechanismFlag.UNWRAP)
        );
      }
      console.log(slotPrintDelimiter)
    }

  }
  return {
    getSlots: () => slots, 
    printProperties: () => printProperties(),
    setSlots: () => slots = mod.getSlots(true),
  }
}

const Sc = (slotNumber) => {
  const slotKey = slotNumber || 0
  const slot = mod.getSlots(slotKey)

  let privateCerts
  let publicCerts = getPublicCerts()

  function scLogin (result) {
    inquirer
      .prompt([
        {
          type: "password",
          message: "Enter a passphrase",
          name: "passphrase"
        }
      ])
      .then( answer => {
        console.log("prompted")
        result(answer)
      })
      .catch(error => {
        console.log("[ERROR]")
        console.log(JSON.stringify(error))
        if (error.isTtyError) {
          // Prompt couldn't be rendered in the current environment
        } else {
          // Something else when wrong
        }
        mod.finalize();
      });
  }

  function getPublicCerts () {
    if (slot.flags & graphene.SlotFlag.TOKEN_PRESENT) {
      scLogin( answer => {
          console.log("got it")
          var session = slot.open();
          let loginResponse = session.login(answer);
          if (!loginResponse) {
            console.log("valid pass")
            let publicKeys = session.find({class: graphene.ObjectClass.PUBLIC_KEY}).items_
  
            for (let item = 0; (item < publicKeys.length); item++) {
              console.log(publicKeys[item])
            }
            session.logout();
            session.close();
          } else
            console.log(loginResponse)
          mod.finalize();
        })
    }
  }
  return {
    setPrivateCerts: () => {},
  }
}

mod.initialize();

let scReader = ScReader()
scReader.setSlots()

if (scReader.getSlots()) {
  if (scReader.getSlots().length > 0) {
    scReader.printProperties()
    let sc = Sc()
    //mod.finalize()
    //console.log("done.")
  } else {
    console.log("[WARNING] smart card not found.")
    mod.finalize()
  }
} else {
  mod.finalize();
  console.log("[WARNING] smart card reader module not found.")
}
