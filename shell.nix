let
  pkgs = import <nixpkgs> { 
    config.permittedInsecurePackages = [ "nodejs-16.20.1" ];
  };
in
pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_16
    pkgs.nodePackages.npm
    pkgs.nodePackages.typescript-language-server
    pkgs.docker-compose
    pkgs.docker-client
  ];
}

