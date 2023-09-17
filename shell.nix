let
  unstablePkgs = import (builtins.fetchTarball {
    url = "https://github.com/NixOS/nixpkgs/archive/3c15feef7770eb5500a4b8792623e2d6f598c9c1.tar.gz";
  }) {};
  pkgs = import <nixpkgs> {
    config.permittedInsecurePackages = [ "nodejs-16.20.1" ];
  };
in
pkgs.mkShell {
  buildInputs = [
    unstablePkgs.bun
    pkgs.nodejs_16
    pkgs.nodePackages.npm
    pkgs.nodePackages.typescript-language-server
    pkgs.docker-compose
    pkgs.docker-client
    pkgs.zellij
  ];
}

