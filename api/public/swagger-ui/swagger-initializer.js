function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
  return null;
}

window.onload = function() {
  //<editor-fold desc="Changeable Configuration Block">

  // the following lines will be replaced by docker/configurator, when it runs in a docker-container
  window.ui = SwaggerUIBundle({
    url: "/docs/openapi.yaml",
    dom_id: '#swagger-ui',
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: "StandaloneLayout",
    requestInterceptor: (req) => {
      req.credentials = "include";

      const xsrf = getCookie("XSRF-TOKEN");
      if (xsrf && ["post", "put", "patch", "delete"].includes(req.method?.toLowerCase())) {
        req.headers["X-CSRF-TOKEN"] = xsrf;
      }

      return req;
    }
  });

  //</editor-fold>
};
