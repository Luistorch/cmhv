import {CMHV} from "../helpers/config.mjs"

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class CmhvItem extends Item {
  chatTemplate = {
    "weapon": "systems/cmhv/templates/chat/chat-weapon.hbs",
    "spell": "systems/cmhv/templates/chat/chat-spell.hbs",
    "item": "systems/cmhv/templates/chat/chat-item.hbs",
    "knowledge": "systems/cmhv/templates/chat/chat-knowledge.hbs",
    "feature": "systems/cmhv/templates/chat/chat-feature.hbs",
    "armor": "systems/cmhv/templates/chat/chat-armor.hbs",

  };

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
   getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {

    const item = this.data;

    // Initialize chat data.
    const rollMode = game.settings.get('core', 'rollMode');
    
    let chatData = {
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      rollMode: rollMode,
      actor: this.actor,
      item: item,
      description: item.data.description ?? ''
    };

    // WEAPON
    if (item.type === "weapon") {
      
      // necessary translations
      let skill = game.i18n.localize("CMHV.AttributeSkill");
      let body = game.i18n.localize("CMHV.AttributeBody"); 
      let precission = game.i18n.localize("CMHV.Precission"); 

      // Retrieve roll data.
      const rollData = this.getRollData();
      // Invoke the roll and submit it to chat.
      const rollPrecission = new Roll("d10+" + this.actor.getRollData().build.skill.value+ "+" + item.data.precission.value, rollData);
      chatData.rollPrecissionFormula = `d10 + ${skill} + ${precission}`;
      // Damage rolls
      let rollDamage = {};
      // Ranged damage
      if(item.data.range.type === "ranged") {
        rollDamage = new Roll(item.data.damage.value + "+" + this.actor.getRollData().build.body.value + "/2", rollData);
        chatData.rollDamageJson = rollDamage.toJSON();
        chatData.rollDamageFormula = `${chatData.rollDamageJson.terms[0].number}d${chatData.rollDamageJson.terms[0].faces} + ${body}/2`;
      }
      // Melee damage
      else {
        rollDamage = new Roll(item.data.damage.value + "+" + this.actor.getRollData().build.body.value, rollData);
        chatData.rollDamageJson = rollDamage.toJSON();
        chatData.rollDamageFormula = `${chatData.rollDamageJson.terms[0].number}d${chatData.rollDamageJson.terms[0].faces} + ${body}`;
      }

      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      chatData.rollPrecission = await rollPrecission.roll({ async: true });
      chatData.rollDamage = await rollDamage.roll({ async: true });

      // Translated range
      chatData.rangeType = CMHV.rangeType[item.data.range.type];
      if(item.data.range.type === "ranged"){
        chatData.rangeValue = item.data.range.value + "m";
      }

      // Translated damage type
      chatData.damageType = CMHV.damageType[item.data.damageType];

      chatData.content = await renderTemplate(this.chatTemplate["weapon"], chatData);

      // Play rolling sound
      AudioHelper.play({src: 'sounds/dice.wav', volume: 0.8, loop: false}, true);

      return ChatMessage.create(chatData);
    }
    // ARMOR
    if(item.type === "armor") {
      // Translations
      const armorType = game.i18n.localize(CMHV.armorType[item.data.armorType]);

      chatData.armorType = armorType;

      chatData.content = await renderTemplate(this.chatTemplate["armor"], chatData);

      // Play rolling sound
      AudioHelper.play({src: 'sounds/dice.wav', volume: 0.8, loop: false}, true);

      return ChatMessage.create(chatData);
    }
    // SPELL
    if(item.type == "spell") {
      
      // Retrieve roll data.
      const rollData = this.getRollData();
      // Invoke the roll and submit it to chat.
      const rollPrecission = new Roll("d10+" + this.actor.getRollData().build.will.value, rollData);
      const rollDamage = new Roll(item.data.spellDamage, rollData);

      chatData.rollDamageJson = rollDamage.toJSON();

      chatData.precissionObjective = 5 + Number.parseInt(item.data.spellLevel);

      // Translated spell circle
      chatData.spellCircle = CMHV.spellCircle[item.data.spellCircle];
      chatData.spellDomain = CMHV.spellDomain[item.data.spellDomain];

      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      chatData.rollPrecission = await rollPrecission.roll({ async: true });
      chatData.rollDamage = await rollDamage.roll({ async: true });

      chatData.level = item.data.spellLevel;

      console.log(item.data);

      // TODO
      // Get the actor kimiya value
      // var kimiya = game.actors.get(chatData.speaker.actor).data.data.kimiya;
      //game.cmhv.ManageResource.manageResource(kimiya, -1);

      chatData.content = await renderTemplate(this.chatTemplate["spell"], chatData);

      // Play rolling sound
      AudioHelper.play({src: 'sounds/dice.wav', volume: 0.8, loop: false}, true);

      return ChatMessage.create(chatData);
    }
    if(item.type === "knowledge") {

      chatData.level = item.data.knowledgeLevel;

      chatData.content = await renderTemplate(this.chatTemplate["knowledge"], chatData);

      // Play rolling sound
      AudioHelper.play({src: 'sounds/lock.wav', volume: 0.8, loop: false}, true);

      return ChatMessage.create(chatData);
    }
    if(item.type === "feature") {

      chatData.content = await renderTemplate(this.chatTemplate["feature"], chatData);

      // Play rolling sound
      AudioHelper.play({src: 'sounds/lock.wav', volume: 0.8, loop: false}, true);

      return ChatMessage.create(chatData);
    }
    // COMMON ITEM
    chatData.value = item.data.value;
    chatData.weight = item.data.weight;
    chatData.quantity = item.data.quantity;

    chatData.content = await renderTemplate(this.chatTemplate["item"], chatData);

    // Play rolling sound
    AudioHelper.play({src: 'sounds/lock.wav', volume: 0.8, loop: false}, true);

    return ChatMessage.create(chatData);
  } // Roll  
  
  /* -------------------------------------------- */

  static chatListeners(html) {
    html.on("click", ".card-buttons button, .inline-action", this._onChatCardButton.bind(this));
  }

  // Funciona bien, sorprendente
  static async _onChatCardButton(event) {
    event.preventDefault();
    
    // Extract card data
    const button = event.currentTarget;
    button.disabled = true;
    const card = button.closest(".chat-card");
    const messageId = card.closest(".message").dataset.messageId;
    const message = game.messages.get(messageId);

    // Get the Actor from a synthetic Token
    const actor = await this._getChatCardActor(card);

  }

  /**
   * Get the Actor which is the author of a chat card
   *
   * @param {HTMLElement} card    The chat card being used
   * @returns {Actor|null}         The Actor Document or null
   * @private
   */
    static async _getChatCardActor(card) {
      // Case 1 - a synthetic actor from a Token
      const tokenUuid = card.dataset.tokenId;
      if (tokenUuid) {
        return (await fromUuid(tokenUuid))?.actor;
      }
  
      // Case 2 - use Actor ID directory
      const actorId = card.dataset.actorId;
      return game.actors.get(actorId) || null;
    }

  /* -------------------------------------------- */
} // Class
