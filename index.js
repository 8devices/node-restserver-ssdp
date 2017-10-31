
var dgram = require('dgram');
var sock = dgram.createSocket('udp6');

sock.bind(1900, function() {
  sock.addMembership('ff02::c');
  console.log('Listening on all addresses');
});

sock.on('message', function (msg, rinfo) {
    console.log('Received request from [' + rinfo.address + ']:' + rinfo.port);

    var lines = msg.toString().split('\r\n');

    if (lines[0] != 'M-SEARCH * HTTP/1.1') {
      console.warn('Invalid request header: ' + lines[0]);
      return;
    }

    var headers = {};
    for (var i = 1; i < lines.length - 2; i++) {
      // Split only at the first separator
      // Proper regex with validation for HTTP header would be better though
      var separator = lines[i].indexOf(':');
      var head = lines[i].substring(0, separator).trim();
      var value = lines[i].substring(separator+1).trim();

      headers[head] = value;
    }

    if (headers['ST'] === 'urn:8devices-com:service:lwm2m:1') {
      var response = 'HTTP/1.1 200 OK\r\n' +
                     'CACHE-CONTROL: max-age=60\r\n' +
                     'EXT:\r\n' +
                     'LOCATION: http://[' + sock.address().address + ']:' + sock.address().port + '/descriptiondocname\r\n' +
                     'SERVER: OS/0.1 UPnP/1.0 X/0.1\r\n' +
                     'ST: urn:8devices-com:service:lwm2m:1\r\n' +
                     'USN: uuid:d03a8702-4d3f-46e8-a33d-9affcc754e2f::urn:8devices-com:service:lwm2m:1\r\n' +
                     '\r\n';

      sock.send(response, 0, response.length, rinfo.port, rinfo.address, (err) => {
        if (err) {
          console.error('Error sending response: ' + err);
        } else {
          console.log('Response sent');
        }
      });
    }
});

