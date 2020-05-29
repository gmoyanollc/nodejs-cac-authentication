const https = require('https');
const inquirer = require("inquirer");
const graphene = require("graphene-pk11");
const grapheneModule = graphene.Module;
const scModule = grapheneModule.load("/lib64/pkcs11/opensc-pkcs11.so", "opensc");
const cli = require("./src/cli.js")

const HttpConnection = (urlArg) => {

  const url = new URL(urlArg)

  const options = {
    cert: null,
    key:  null,
    host: url.host,
    path: url.pathname + url.search,
    checkServerIdentity: () => { return null; },
    rejectUnauthorized: true,
    requestCert: true
  };

  function request () {
    var httpsRequest = https.request(options, (httpResponse) => { 
      httpResponse.on('data', function(data) { 
          process.stdout.write(data); 
      }); 
    }); 
    httpsRequest.end(); 
    httpsRequest.on('error', function(e) { 
        console.error(e); 
    });
  }
  return {
    getOptions: () => options ,
    request: () => request(),
    setOptionCert: (cert) => options.cert = cert,
    setOptionKey: (key) => { options.key = key },
    setOptions: (httpOptions) => options = httpOptions,
    setHost: (host) => { options.host = host },
  }
}

const ScReader = (readerSlots) => {
  const slots = readerSlots

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
    setSlots: () => slots = scModule.getSlots(true),
  }
}

const Sc = (scSlot) => {
  const slot = scSlot
  const slotSession = slot.open()
  const token = slot.getToken() 
    //if (slotSession.flags & graphene.SlotFlag.TOKEN_PRESENT) 
  const grapheneCertObject = slotSession.getObject(slotSession.find({class: graphene.ObjectClass.CERTIFICATE}).items_[0]).toType()
  const grapheneCertPublicKeyObject = slotSession.getObject(slotSession.find({class: graphene.ObjectClass.PUBLIC_KEY}).items_[0]).toType()
  
  /* function parseCertBase64 (certBase64) {
    const test = new Uint8Array(["test"]).buffer;
    const buffer = new Uint8Array([certHex]).buffer;
    const asn1 = asn1js.fromBER(buffer);
    const certificate = new pkijs.Certificate({ schema: asn1.result });
  } */

  function printCertInfo (certObject) {

    function logCertInfo (cert) {
      // [Displaying certificate information. #75](https://github.com/PeculiarVentures/graphene/issues/75)
      console.log("Certificate info:\n===========================");
      console.log("Handle:", cert.handle.toString("hex"));
      console.log("ID:", cert.id.toString("hex"));
      console.log("Label:", cert.label);
      //console.log("category:", graphene.CertificateCategory[cert.category]);
      console.log("Subject:", cert.subject.toString("hex"));
      console.log("Issuer:", cert.issuer.toString("hex"));
      console.log("Value:", cert.value.toString("hex"));
    }

    let certObjectItem = certObject || grapheneCertObject
    logCertInfo(certObjectItem)
  }

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
        console.log("[INFO] passphrase inquiry answered")
        result(answer)
      })
      .catch(error => {
        console.log("[ERROR] passphrase inquiry")
        console.log(JSON.stringify(error))
        if (error.isTtyError) {
          // Prompt couldn't be rendered in the current environment
        } else {
          // Something else when wrong
        }
        scModule.finalize();
      });
  }

  function getPublicKey (keyObject) {
    let keyObjectItem = keyObject || grapheneCertPublicKeyObject
    return keyObjectItem.getAttribute({ modulus: null, publicExponent: null })
  }

  return {
    //setSlot: (slotNumber) => { readerSlot = slotNumber },
    getToken: () => token, 
    getBase64Cert: () => "-----BEGIN CERTIFICATE-----"
    + grapheneCertObject.value.base64Slice() + "-----END CERTIFICATE-----", 
    getBase64PublicKey: (keyObject) => {
      const publicKey = getPublicKey(keyObject);
      console.log(JSON.stringify(publicKey, null, 2));
      return "-----BEGIN RSA PUBLIC KEY-----" + publicKey.modulus.base64Slice() + publicKey.publicExponent.base64Slice() + "-----END RSA PUBLIC KEY-----"
    },
    printCertInfo: (certObject) => printCertInfo(certObject)
  }
}

const cliFactory = cli.cliFactory()

scModule.initialize();
let scReader = ScReader(scModule.getSlots(true))
if (scReader.getSlots()) {
  if (scReader.getSlots().length > 0) {
    scReader.printProperties()
    if (scReader.getSlots().length = 1) {
      let sc = Sc(scModule.getSlots(0))
      //sc.printCertInfo()
      let httpConnection = HttpConnection(cliFactory.getScriptUrl())
      httpConnection.setOptionCert(sc.getBase64Cert())
      httpConnection.setOptionKey(sc.getBase64PublicKey())
      console.log(httpConnection.getOptions())
      httpConnection.request()
    } else {
      console.log("[WARNING] more than one smart card found.")
      scModule.finalize()
    }
  } else {
    console.log("[WARNING] smart card not found.")
    scModule.finalize()
  }
} else {
  scModule.finalize();
  console.log("[WARNING] smart card reader module not found.")
}
