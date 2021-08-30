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