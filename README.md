# SmashMeme

- Jeu style SmashBros
- Graphisme 2D
- Animations fluides

![Capture d'écran](screenshot.jpg)

## Lancer un serveur

Executer ceci dans un terminal dans le dossier cloné :

```bash
npm install
npm run start
```

SmashMeme est maintenant accessible sur [http://localhost:13028](http://localhost:13028)

### Relier à Apache

Pointer le serveur vers le dossier cloné puis activer les modules nécessaires :

```bash
a2enmod proxy proxy_http rewrite
systemctl restart apache2
```

Normalement le fichier [.htaccess](.htaccess) s'occupe du reste


## Dépendences

Petite utilisation de [gif.js](https://github.com/jnordberg/gif.js)


![](https://img.shields.io/github/package-json/v/ptlc8/smashmeme)
[![CodeFactor](https://www.codefactor.io/repository/github/ptlc8/smashmeme/badge)](https://www.codefactor.io/repository/github/ptlc8/smashmeme)
![](https://img.shields.io/tokei/lines/github/ptlc8/smashmeme)