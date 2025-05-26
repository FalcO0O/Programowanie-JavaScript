/**
* @author Stanisław Polak <polak@agh.edu.pl>
*/
Deno.serve(async (req: Request) => {
  const url: URL = new URL(req.url);

  switch ([req.method, url.pathname].join(" ")) {
    case "GET /":
      return new Response(
`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Vanilla Deno application</title>
  </head>
  <body>
    <main>
      <h1>Vanilla Deno application</h1>
      <form method="POST" action="/">
        <label for="name">Give your name</label>
        <input name="name">
        <br>
        <input type="submit">
        <input type="reset">
      </form>
    </main>
  </body>
</html>`,
        {
          headers: {
            "content-type": "text/html; charset=utf-8",
          },
        }
      );
    case "POST /": {
      const data: FormData = await req.formData();
      return new Response(`Hello '${data.get("name")}'`);
    }
    default:
      return new Response("Error 501: Not implemented", { status: 501 });
  }
});