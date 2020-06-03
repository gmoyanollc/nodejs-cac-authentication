# PKCS11-JS CAC Authentication

[ ] research about different smartcard types: sle4442 vs cac type
[ ] CAC is disabled after 1 successful log-on
[ ] negotiate TSL/SSL communication with a server

## PIV
Audited and certified by the Federal Public Key Infrastructure (FPKI) are four separate certificates and key pairs, issued from certificate authorities (https://piv.idmanagement.gov/): 

 * Card Authentication, 
 * PIV Authentication, 
 * Digital Signature, and 
 * Encryption

### Account Linking
Associating a credential with an account is called Account Linking. (https://piv.idmanagement.gov/identifiers/)

There are two attributes in your network domain directories to choose from:

 * Principal Name 
 * altSecurityIdentities 

#### Principal Name
 * The User Principal Name value from the Subject Alternate Name in the PIV authentication certificate is required to be populated during PIV credential issuance (https://piv.idmanagement.gov/networkconfig/accounts/)

### Server-Client Interactions
(https://wiki.mozilla.org/PSM:CertPrompt)
"the server sends to the client a list of the names of issuers of client certificates that are acceptable to the server. The client is supposed to only respond with a certificate issued by one of the issuers named by the server."


## Smart Card SLE4442
"The main features of the SLE4442 are (http://www.smartcardworld.com/SLE4442.htm):
 * Synchronous communication protocol,
 * ISO 7816 compatible"
 
"Intelligent 256-Byte EEPROM with Write Protect Function and Programmable Security Code (PSC). This chip contains and EEPROM organized 1024 x 8 bit offering the possibility of programmable write protection for each byte. Reading of the whole memory is always possible. The memory can be written and erased byte by byte ." (http://www.smartcardsupply.com/Content/Cards/ISO7816.htm)

### ISO 7816
[ISO 7816 - Smart Card Standards Overview](http://www.smartcardsupply.com/Content/Cards/7816standard.htm)

#### ISO 7816-1 
 * defines the characteristics of a card when it is bent or flexed.

#### ISO 7816-2 
 * defines the dimensions and location of the contacts. This part includes standards about number, function and position of the electrical contacts.
 
#### ISO 7816-3 
 * Software development specification to communicate from a microcontroller or a PC's serial/parallel/USB/PCMCIA port.
 
#### ISO 7816-4
 * Further standardization of additional inter-industry commands and security architectures.
 
## DER Certificate Format
[Cryptography Tutorials - Herong's Tutorial Examples](http://www.herongyang.com/Cryptography/Certificate-Format-OpenSSL-View-in-DER-and-PEM.html)

### Certificate Examples
Certificates are public keys that correspond to a private key, and that are digitally signed either by a Certificate Authority or by the owner of the private key (such certificates are referred to as "self-signed"). (https://nodejs.org/api/tls.html#tls_tls_ssl_concepts)

#### Generate private key
openssl genrsa -out test.key.pem -aes128

#### Generate public key from Private key
openssl rsa -in test.key.pem -outform PEM -pubout -out test.public.pem

#### Create Self-Signed DER Certificate with Private Key
openssl req -new -x509 -key test.key -out test.der -outform der

##### Print Certificate
openssl x509 -in test.der -inform der -noout -text

#### DoD
##### Decode DoD Base64 DER Public Key
openssl base64 -d -A -in g-public-key.der.base64 -out g-public-key.der

###### Print Certificate
openssl x509 -in g-public-key.der -inform der -noout -text

##### Convert DoD DER Public Key to PEM
PEM result is the same as Base64 encoded DER.

openssl x509 -in g-public-key.der -inform der -outform pem -out g-public-key.pem

[Openssl Certificates Tips & Tricks DER CRT CER PEM](https://www.schalley.eu/2010/12/30/openssl-certificates-tips-tricks-der-crt-cer-pem/)
