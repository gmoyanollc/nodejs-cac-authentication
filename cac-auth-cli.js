const inquirer = require("inquirer");
var graphene = require("graphene-pk11");
var Module = graphene.Module;

var mod = Module.load("/lib64/pkcs11/opensc-pkcs11.so", "opensc");

mod.initialize();

var slots = mod.getSlots(true);
if (slots.length > 0) {
  for (var i = 0; i < slots.length; i++) {
    var slot = slots.items(i);
    console.log("Slot #" + slot.handle);
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
  }
  var slot = mod.getSlots(0);
  if (slot.flags & graphene.SlotFlag.TOKEN_PRESENT) {
    inquirer
      .prompt([
        {
          type: "password",
          message: "Enter a passphrase",
          name: "passphrase"
        }
      ])
      .then(answer => {
        var session = slot.open();
        let loginResponse = session.login(answer);
        if (!loginResponse) {
          let publicKeys = session.find({class: graphene.ObjectClass.PUBLIC_KEY}).items_

          for (let item = 0; (item < publicKeys.length); item++) {
            console.log(publicKeys[item])
          }

          /*// generate AES key
          var key = session.generateKey(graphene.KeyGenMechanism.AES, {
            class: graphene.ObjectClass.SECRET_KEY,
            token: false,
            valueLen: 256 / 8,
            keyType: graphene.KeyType.AES,
            label: "My AES secret key",
            encrypt: true,
            decrypt: true
          });
          console.log(key);
          // enc algorithm
          var alg = {
            name: "AES_CBC_PAD",
            params: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6]) // IV
          };
          var MESSAGE = "Encrypted message";

          // encrypting
          var cipher = session.createCipher(alg, key);
          var enc = cipher.update(MESSAGE);
          enc = Buffer.concat([enc, cipher.final()]);
          console.log("Enc:", enc.toString("hex")); // Enc: eb21e15b896f728a4...

          // decrypting
          var decipher = session.createDecipher(alg, key);
          var dec = decipher.update(enc);
          var msg = Buffer.concat([dec, decipher.final()]).toString();
          console.log("Message:", msg.toString()); // Message: Encrypted message */

          session.logout();
          session.close();
          // Get a number of private key objects on token
          //console.log(session.find({class: graphene.ObjectClass.PRIVATE_KEY}).length);
        } else
          console.log(loginResponse)
        mod.finalize();
      })
      .catch(error => {
        if (error.isTtyError) {
          // Prompt couldn't be rendered in the current environment
        } else {
          // Something else when wrong
        }
        mod.finalize();
      });
  }
} else {
  mod.finalize();
  console.log("[WARNING] smart card device or card not found.")
}
