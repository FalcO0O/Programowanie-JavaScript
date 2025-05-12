/**
 * @author Stanisław Polak <polak@agh.edu.pl>
 */

// const http = require('node:http');
// const { URL } = require('node:url');
import http from "node:http";
import { URL } from "node:url";

/**
 * Handles incoming requests.
 *
 * @param {IncomingMessage} request - Input stream — contains data received from the browser, e.g,. encoded contents of HTML form fields.
 * @param {ServerResponse} response - Output stream — put in it data that you want to send back to the browser.
 * The answer sent by this stream must consist of two parts: the header and the body.
 * <ul>
 *  <li>The header contains, among others, information about the type (MIME) of data contained in the body.
 *  <li>The body contains the correct data, e.g. a form definition.
 * </ul>
 * @author Stanisław Polak <polak@agh.edu.pl>
 */

function requestListener(request, response) {
    console.log("--------------------------------------");
    console.log(`The relative URL of the current request: ${request.url}`);
    console.log(`Access method: ${request.method}`);
    console.log("--------------------------------------");
    // Create the URL object
    const url = new URL(request.url, `http://${request.headers.host}`);
    /* ************************************************** */
    // if (!request.headers['user-agent'])
    if (url.pathname !== "/favicon.ico")
        // View detailed URL information
        console.log(url);

    /* *************** */
    /* "Routes" / APIs */
    /* *************** */

    const route = [request.method, url.pathname].join(" ");
    switch (route) {
        /* 
              -------------------------------------------------------
              Generating the form if 
                 the GET method was used to send data to the server
              and 
                 the relative URL is '/', 
              ------------------------------------------------------- 
        */
        case "GET /":
            /* ************************************************** */
            // Creating an answer header — we inform the browser that the returned data is HTML
            /* ************************************************** */
            response.writeHead(200, { "Content-Type": "text/html" });
            /* ************************************************** */
            // Setting a response body
            response.write(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Vanilla Node.js application</title>
  </head>
  <body>
    <main>
      <h1>Vanilla Node.js application</h1>
      <form method="GET" action="/submit">
        <label for="name">Give your name:</label>
        <input name="name" value="Róża (123)">
        <br>
        <label>Generate data in the format:</label><br>
        <input type="submit" value="Plain"><br>
        <input type="submit" value="JSON" formaction="/submit.json"><br>
        <input type="submit" value="XML" formaction="/submit.xml"><br>
        <input type="submit" value="XML+CSS" formaction="/submit.css"><br>
        <input type="submit" value="XML+XSL" formaction="/submit.xsl">
        <hr>
        <input type="reset">
      </form>
    </main>
  </body>
</html>`);
            /* ************************************************** */
            response.end(); // The end of the response — send it to the browser
            break;

        /* 
              ------------------------------------------------------
              Processing the form content, if 
                  the GET method was used to send data to the server
              and 
                  the relative URL is '/submit', 
              ------------------------------------------------------
        */
        case "GET /submit":
            /* ************************************************** */
            // Creating an answer header — we inform the browser that the returned data is plain text
            /* ************************************************** */
            response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
            /* ************************************************** */
            // Place given data (here: 'Hello <name>') in the body of the answer
            response.write(`Hello '${url.searchParams.get("name")}'`); // "url.searchParams.get('name')" contains the contents of the field (form) named 'name'
            /* ************************************************** */
            response.end(); // The end of the response — send it to the browser
            break;

        case "GET /submit.json":
            /* ************************************************** */
            // Creating an answer header — we inform the browser that the returned data is JSON
            /* ************************************************** */
            response.writeHead(200, {
                "Content-Type": "application/json",
            });
            response.write(
                JSON.stringify({
                    names: [
                        { name: `${url.searchParams.get("name")}` },
                        { name: "Example name #1" },
                        { name: "Example name #2" },
                    ],
                })
            );
            response.end();
            break;

        case "GET /submit.css":
        case "GET /submit.xml":
        case "GET /submit.xsl": {
            /* ************************************************** */
            // Creating an answer header — we inform the browser that the returned data is XML
            /* ************************************************** */
            response.writeHead(200, {
                "Content-Type": "application/xml",
            });
            let xml = '<?xml version="1.0"?>';
            if (route == "GET /submit.css") {
                xml += '<?xml-stylesheet type="text/css" href="stylesheet.css"?>'; // Format the XML document based on the CSS stylesheet named 'stylesheet.css'
            }
            if (route == "GET /submit.xsl") {
                xml += '<?xml-stylesheet type="text/xsl" href="stylesheet.xsl"?>'; // Format the XML document based on the XSL stylesheet named 'stylesheet.xsl'
            }
            xml += `<names>
                    <name>${url.searchParams.get("name")}</name>
                    <name>Example name #1</name>
                    <name>Example name #2</name>
              </names>`;
            response.write(xml);
            response.end();
            break;
        }
        case "GET /stylesheet.css": {
            /* ************************************************** */
            // Creating an answer header — we inform the browser that the returned data is CSS
            /* ************************************************** */
            response.writeHead(200, {
                "Content-Type": "text/css; charset=utf-8",
            });
            const css = `/* Author: Stanisław Polak <polak@agh.edu.pl> */
                            
                    names:before {
                        font-weight: bold;
                        font-size: xxx-large;
                        content: "Greetings";
                    }

                    name { 
                        color: white; 
                        background-color : gray; 
                        display: block;
                        margin: 1ex;
                        width: fit-content;
                    } 
                    
                    name:before {
                        content: "Hello ";
                    }`;
            response.write(css);
            response.end();
            break;
        }
        case "GET /stylesheet.xsl": {
            /* ************************************************** */
            // Creating an answer header — we inform the browser that the returned data is XSL
            /* ************************************************** */
            response.writeHead(200, {
                "Content-Type": "application/xml",
            });
            const xsl = `<?xml version="1.0"?>
        <!-- Author: Stanisław Polak <polak@agh.edu.pl> -->
        <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="3.0">
            <!-- ******* Template #1 ******* -->
            <xsl:template match="/">
                <html>
                    <head>
                        <meta charset="utf-8"/>
                        <meta name="viewport" content="width=device-width, initial-scale=1"/>
                        <title>Welcome</title>
                        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-SgOJa3DmI69IUzQ2PVdRZhwQ+dy64/BUtbMJw1MZ8t5HZApcHrRKUc4W0kG879m7" crossorigin="anonymous"/>
                    </head>
                    <body class='container'>
                        <h1>Greetings</h1>
                        <xsl:apply-templates/>
                        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.5/dist/js/bootstrap.bundle.min.js" integrity="sha384-k6d4wzSIapyDyv1kpU366/PK5hCdSbCRGRCMv+eplOQJWyd1fbcAu9OCUj5zNLiq" crossorigin="anonymous"></script>
                    </body>
                </html>
            </xsl:template>
            <!-- ******* Template #2 ******* -->
            <xsl:template match="names">
                <ol>
                    <xsl:apply-templates/>
                </ol>
            </xsl:template>
            <!-- ******* Template #3 ******* -->
            <xsl:template match="name">
                <li>
                    <span class="badge text-bg-secondary">
                        Hello '<xsl:value-of select="."/>'
                    </span>
                </li>
            </xsl:template>

        </xsl:stylesheet>`;
            response.write(xsl);
            response.end();
            break;
        }
        case "POST /": {
            let body = '';
            
            request.on('data', chunk => {
                body += chunk.toString();
            });
        
            request.on('end', () => {
                const params = new URLSearchParams(body);
                const name = params.get("name");
        
                response.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
                response.write(`Hello '${name}'`);
                response.end();
            });
        
            break;
        }
        /* 
              ----------------------
              If no route is matched 
              ---------------------- 
        */
        default: {
            response.writeHead(501, { "Content-Type": "text/plain" });
            response.write("Error 501: Not implemented");
            response.end();
            
        }
    }
}

/* ************************************************** */
/* Main block
/* ************************************************** */
const server = http.createServer(requestListener); // The 'requestListener' function is defined above
server.listen(8000);
console.log("The server was started on port 8000");
console.log('To stop the server, press "CTRL + C"');