// Grâce à Browserify, on peut importer nos fichiers sous forme de module avec require. Comme dans Node.js !

const utils = require('./utils');
const listModule = require('./list');
const cardModule = require('./card');

// on objet qui contient des fonctions
var app = {
  

  // fonction d'initialisation, lancée au chargement de la page
  init: function () {
    console.log('coucou');
    console.log('app.init !');
    app.addListenerToActions();
    app.getListsFromAPI();
  },
  addListenerToActions: () => {
    document.getElementById('addListButton').addEventListener('click', listModule.showAddListModal);
    const closeBtns = document.getElementsByClassName('close');
    for(const btn of closeBtns) {
      btn.addEventListener('click', utils.hideModals);
    }
    document.querySelector('#addListModal form').addEventListener('submit', listModule.handleAddListForm);
    const btnsCreateCard = document.querySelectorAll('.button--add-card');
    for(const btn of btnsCreateCard) {
      btn.addEventListener('click', cardModule.showAddCardModal);
    }
    document.querySelector('#addCardModal form').addEventListener('submit', cardModule.handleAddCardForm);
  },
  
  
  getListsFromAPI: async () => {
    try {
      const response = await fetch(`${utils.base_url}/lists`);
      if(response.status !== 200) throw await response.json();
      const lists = await response.json();
      // je ne peux pas faire : app.makeListInDOM(lists);
      // car lists contient un TABLEAU de listes. Je dois d'abord boucler dessus
      for(const list of lists) {
        // on appelle la méthode makeListInDom pour créer visuellement nos listes ! On lui passe en paramètre l'objet list, beaucoup plus simple à manipuler qu'en passant plusieurs paramètres les uns à la suite des autres (car il faut se souvenir et respecter l'ordre dans ce cas là !)
        listModule.makeListInDOM(list);
        // on veut afficher toutes les cartes de la liste en cours
        for(const card of list.cards){
          // ici on génère visuellement chaque cartes. ENcore une fois, on passe en paramètre de la fonction l'objet de la carte et plus simplement son nom et l'id de la liste (on pourra récupérer directement l'id de la liste à partir de la carte avec sa propriété list_id).
          cardModule.makeCardInDom(card);
        }
      }
      // ----- DRAG & DROP -------
      // on récupère le container qui contient toutes les listes
      const divLists = document.querySelector('.card-lists');
      // on le donne à une instance de Sortable afin que ses élèments puissent être déplacer
      const sortable = new Sortable(divLists, {
        draggable: '.panel',
        animation: 150,
        // on appelle la fonction dropList pour mettre à jour la position de chaque listes côté back à la fin du drag & drop
        onEnd: listModule.dropList
      });
    } catch(error) {
      console.error(error);
    }
    
  }

};


// on accroche un écouteur d'évènement sur le document : quand le chargement est terminé, on lance app.init
document.addEventListener('DOMContentLoaded', app.init );