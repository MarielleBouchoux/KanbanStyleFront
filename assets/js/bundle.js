(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
},{"./card":2,"./list":3,"./utils":4}],2:[function(require,module,exports){
const utils = require('./utils');
const cardModule = {
    showAddCardModal: (event) => {
        document.getElementById('addCardModal').classList.add('is-active');
        // récupérer la liste où on a cliqué sur le bouton
        const listId = event.target.closest('[data-list-id]').dataset.listId;
        // changer la valeur de list_id (input hidden) en lui donant l'id de la liste récupérée
        document.querySelector('#addCardModal input[type="hidden"]').value = listId;
       
        
        //input.value = listId;
      },
      handleAddCardForm: async (event) => {
        // couper le rechargement de la page
        event.preventDefault();
        // recuperer le formulaire
        const formData = new FormData(event.target);
    
        try {
          const response = await fetch(`${utils.base_url}/cards`, {
            method: 'POST',
            body: formData
          });
          if(response.status !== 201) throw await response.json();
          const card = await response.json();
          // insère visuellement la carte nouvellement crée
          cardModule.makeCardInDom(card);
        } catch(error) {
          console.error(error);
        }
      
        utils.hideModals();
      },
      
      makeCardInDom: (card) => {
        const template = document.getElementById('card-template');
        const newCard = document.importNode(template.content, true);
        // const newCard = template.content;
        newCard.querySelector('.card-name').textContent = card.content;
        // on modifie le data id de la carte
        const divCard = newCard.querySelector('[data-card-id]');
        divCard.dataset.cardId = card.id;
        // on lui met un background-color de la couleur qu'il faut
        divCard.style.backgroundColor = card.color;
        // on modifie l'id de l'input pour qu'on puisse ensuite cibler la bonne carte lors de la soumission du formulaire
        divCard.querySelector('input[name="id"]').value = card.id;
        newCard.querySelector('.button--edit-card').addEventListener('click', cardModule.showEditCardForm);
        newCard.querySelector('.button--delete-card').addEventListener('click', cardModule.deleteCard);
        
        // le querySelector cible ici la div ayant la classe .panel-block de la div ayant comme attribut data-list-id et comme valeur l'id de la liste passé en paramètre de notre fonction. 
        document.querySelector(`[data-list-id="${card.list_id}"] .panel-block`).appendChild(newCard);
      },
      
      showEditCardForm: (event) => {
        const form = event.target.closest('.box').querySelector('form');
        // on attache au formulaire l'evenement submit pour qu'on puisse modifier la carte
        event.target.closest('.box').querySelector('.card-name').classList.add('is-hidden');
        form.addEventListener('submit', cardModule.handleEditCard);
        form.classList.remove('is-hidden');
    
      },
      handleEditCard: async (event) => {
        event.preventDefault();
        try {
          const formData = new FormData(event.target);
          const response = await fetch(`${utils.base_url}/cards/${formData.get('id')}`, {
            method: 'PATCH',
            body:formData
          });
          if(response.status !== 200) throw await response.json();
          const card = await response.json();
          const cardName = event.target.closest('.box').querySelector('.card-name');
          console.log(cardName);
          cardName.textContent = card.content;
          cardName.classList.remove('is-hidden');
          event.target.classList.add('is-hidden');
        } catch(error) {
          console.error(error);
        }
        
      },
      deleteCard: async (event) => {
         // on doit récupérer l'id de la carte pour savoir laquelle on supprime !
         //const card = event.target.closest('.box');
         const card = event.target.closest('[data-card-id]');
         const cardId = card.dataset.cardId;
         try {
                //const cardId = card.getAttribute('data-card-id');
            const response = await fetch(`${utils.base_url}/cards/${cardId}`, {
                method: 'DELETE'
            });
            // pas besoin de s'embêter avec le code réponse (200, 201...) car on peut directement exploiter la propriété .ok de response qui nous renverra true si on a reçu un code de succès (plage entre 200 et 299), false dans le cas inverse.
            if(!response.ok) throw await response.json();
            // on supprime la carte du DOM !
            card.remove();
         } catch (error) {
             console.error(error);
         }
         
      }
}

module.exports = cardModule;
},{"./utils":4}],3:[function(require,module,exports){
const utils = require('./utils');
const cardModule = require('./card');
const listModule = {
    showAddListModal: () => {
        document.getElementById('addListModal').classList.add('is-active');
      },
      handleAddListForm: async (event) => {
        // on coupe le rechargement de la page
        event.preventDefault();
        // on passe en constructeur de FormData le formulaire qui a déclenché l'évènement submit : event.target. Ainsi on pourra facilement récupérer ses données avec get()
        const formData = new FormData(event.target);
    
        try {
          // ici on doit créer une liste, donc on doit renseigner en second paramètre de fetch un objet de config incluant deux propriétés : la premiere est la methode http utilisée (post) et la deuxieme est le body de la requête (donc le retour du formulaire, ici formData)
          const response = await fetch(`${utils.base_url}/lists`, {
            method: 'POST',
            body: formData
          });
          if(response.status !== 201) throw await response.json();
          const list = await response.json();
          // On appelle la méthode pour créer une nouvelle liste en lui passant en paramètre le nom donné dans le formulaire
          listModule.makeListInDOM(list);
    
        } catch(error) {
          console.error(error);
        }
        
         // ici on ne s'embete pas à réécrire le code pour fermer la modal puisqu'on a déjà une fonction prête à l'emploi dont on peut se servir !
        utils.hideModals();
      },
      makeListInDOM: (list) => {
        // on cible le template
        const template = document.getElementById('list-template');
        // on clone tout le contenu (true) du template 
        const newList = document.importNode(template.content, true);
        // on cible le titre de la liste et on modifie son titre avec ce qui a été renseigné dans le formulaire d'ajout
        const h2 = newList.querySelector('h2');
        h2.textContent = list.name;
        h2.addEventListener('dblclick', listModule.showEditListForm);
    
        // on modifie data-list-id de la liste
        const div = newList.querySelector('[data-list-id]');
        
        //façon classique de faire : div.setAttribute('data-list-id', name)
        // cependant, on manipule ici un attribut data, on peut y accéder via dataset.sonNom
        // attention, si le nom du data attribut contient un - il faut le retirer et mettre une majuscule à la lettre d'après (camelCase)
        // exemple ici : list-id en listId
        div.dataset.listId = list.id;
    
        // je cible l'input id du formulaire pour lui appliquer le bon id. Ca sera utile lorsqu'on voudra éditer la liste (pour cibler la bonne liste)
        div.querySelector('input[name="id"]').value = list.id;
    
        newList.querySelector('.button--add-card').addEventListener('click', cardModule.showAddCardModal);
    
        newList.querySelector('.button--delete-list').addEventListener('click', listModule.deleteList);
        // on insère la nouvelle liste dans le document
        document.querySelector('.card-lists').appendChild(newList);
      },
      showEditListForm: (event) => {
        event.target.classList.add('is-hidden');
        const form = event.target.closest('.panel').querySelector('form');
        form.classList.remove('is-hidden');
        form.addEventListener('submit', listModule.handleEditList);
      },
      handleEditList: async (event) => {
        event.preventDefault();
        // ici event.target c'est le formulaire qui appelle l'evenement submit !
        try {
          // event.target c'est l'élément HTML origine de l'évènement déclenché, ici le formulaire
          const formData = new FormData(event.target);
          // l'utilisation de formData nous évite à cibler nos inputs pour récuperer leur valeur !
          // nous évite de : const name = document.getElementById('inputName').value;
          // ici on utilise la méthode patch de fetch pour modifier la liste ciblée
          const response = await fetch(`${utils.base_url}/lists/${formData.get('id')}`, {
          method: 'PATCH',
          body:formData
          });
          if(response.status !== 200) throw await response.json();
          const list = await response.json();
          const h2 =  event.target.closest('.panel').querySelector('h2');
          h2.textContent = list.name; // on aurait pu mettre formData.get('name')
          event.target.classList.add('is-hidden');
          h2.classList.remove('is-hidden');
    
        } catch(error) {
          console.error(error);
        }
        
      },
      deleteList: async (event) => {
          // on demand ela confirmation. Si la personne clique sur valider, "true" sera stocké dans la variable. false sinon.
        const wantDelete = confirm('Voulez-vous vraiment supprimer cette liste ?');
        if(!wantDelete) return;

        const list = event.target.closest('.panel');
        const listId = list.dataset.listId;
        // on vérifie si la liste a déjà des cartes, si c'est le cas alors on empêcvhe la suppression
        if(list.querySelectorAll('.box').length) return alert('Désolé mais non car il y a des cartes au sein de cette liste !');
        try {
            const response = await fetch(`${utils.base_url}/lists/${listId}`, {
                method: 'DELETE'
            });
            if(!response.ok) throw await response.json();
            list.remove();
        } catch(error) {
            console.error(error);
        }
      },
      dropList: async () => {
          // on recupère toutes les listes dans le DOM
        const lists = document.querySelectorAll('.panel');
          // puis on appelle la methode patch sur chacune d'entre elles
        for(let i = 0; i < lists.length; i++){
            try {
                // on fait un objet formData qui va contenir la nouvelle position de la liste. Effectivement, le body de la methode patch ou post attend un formData et rien d'autre
                const formData = new FormData();
                // on lui donne la bonne position avec la méthode set de formData
                formData.set('position', i + 1);
                // on récupère l'id de la liste  du dom en cours 
                const listId = lists[i].dataset.listId;
                // on appelle fetch pour mettre à jour sa position en base
                const response = await fetch(`${utils.base_url}/lists/${listId}`, {
                    method: 'PATCH',
                    body: formData
                });
                if(!response.ok) throw await response.json();
            } catch(error) {
                console.error(error);
            }

        }
      }
}

module.exports = listModule;
},{"./card":2,"./utils":4}],4:[function(require,module,exports){
const utils = {
    base_url: 'http://localhost:3000',
    hideModals: () => {
        const modals = document.querySelectorAll('.modal');
        for(const modal of modals) {
          modal.classList.remove('is-active');
        }
      },
}

module.exports = utils;
},{}]},{},[1]);
