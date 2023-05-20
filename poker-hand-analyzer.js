//imports ----------------------------
var colors=require('colors')
var shuffle=require('shuffle-array')

//prototypes ----------------------------
String.prototype.color = function (color) {
  result = this.bold[color]
  if (typeof(result) != "string") {return false}
  return result
};
String.prototype.has = function (comparison) {
  if (this.indexOf(comparison) < 0) {return false}
  return true
};
Object.prototype.hasKey = function(item=false) {
  if (item == false) {return false}
  if (item in this) {return true}
  return false
};
Array.prototype.shuffle = function () {
  new_arr=[]
  for (var i=1; i <=5 ;i++) {
    new_arr=shuffle(this)
  }
  return new_arr
}
Array.prototype.has = function (comparison) {
  if (this.indexOf(comparison) < 0) {return false}
  return true
};

//card and deck creation ----------------------------
var deck = {"cards":[]};
deck.generate = function() {
  if (deck.cards.length == 52) {return false}
  var suits=["spades", "hearts", "clubs", "diamonds"]
  var fctv={11: "J", 12:"Q", 13: "K", 1:"A"}//fctv = face_card_to_value
  for (suit_name of suits) {
    for (var i=1;i<=13;i++) {
      var name="";
      if (fctv.hasKey(i)) {name=fctv[i]+"_"+suit_name}
      if (!name.length) {name=i+"_"+suit_name}
      if (suit_name[0] == "s" || suit_name[0] == "c") {name=name.color("blue")} else {name=name.color("red")}
      deck.cards.push({"value":i, "name":name, "suit":suit_name[0]})
    }
  }
}
deck.river = {"item":"", "suit_list":[], "value_list":[]}
deck.river.deal = function () {
  rnd = function () {var r = Math.floor(Math.random() * 51);return r} //generates a random index which is used to choose cards from the deck array (deck.cards)
  for (var i=1; i <=5 ;i++) {
    var card = deck.cards.shuffle()[rnd()]  //shuffle(): shuffles the deck five times per call
    if (deck.river.item.has(card.name)) {i-=1;continue} //ensures no cards are repeated
    deck.river.item+=card.name+" "
    deck.river.suit_list.push(card.suit)
    deck.river.value_list.push(card.value)
  }
}
deck.river.display = function () {
  if (!deck.river.item.len) {deck.river.deal()}
  console.log(deck.river.item)
}

deck.hand = {"list":[]}
deck.hand.deal = function (amount=1) {
  if (typeof(amount) != "number") {amount=1}
  if (amount > 10) {amount=10} //texas-holdem poker allows maximum of 10 players
  var rnd = function () {var r = Math.floor(Math.random() * 51);return r} //generates a random index which is used to choose cards from the deck array (deck.cards)
  var hand_map={} ; var card_display="" ; var suit_list=[] ; var value_list=[]
  for (var i=1; i <= 2 ;i++) {
    var card = deck.cards.shuffle()[rnd()]
    if (card_display.has(card.name)) {i-=1;continue} //ensures that no cards in the hand are repeated
    if (deck.river.item.has(card.name)) {i-=1;continue} //ensures that no cards between the river and hand are repeated
    card_display+=card.name+" " //shuffle(): shuffles the deck five times per call
    suit_list.push(card.suit)
    value_list.push(card.value)
  }
  hand_map["value_list"] = value_list
  hand_map["suit_list"] = suit_list
  hand_map["display"] = card_display
  deck.hand.list.push(hand_map)

  if (amount > 1) {
    amount-=1
    return deck.hand.deal(amount)
  }
}

deck.generate()
deck.river.display() //this function call internally calls deck.river.deal(), and then prints the graphical result in the terminal.
deck.hand.deal()
console.log("\n"+deck.hand.list[0].display+"\n")

// hand analysis ----------------------------
var determine_hand = function (river, hand=false) {
  if (!hand) {
    if (!deck.hand.list.length) {deck.hand.deal()}
    hand=deck.hand.list[0]
  }
  if (!deck.river.item.length) {deck.river.deal()}

  vl = (hand.value_list.concat(river.value_list)).sort() //vl=value_list
  sl = (hand.suit_list.concat(river.suit_list)).sort() //sl=suit_list

  var get_instances = function (vl) { //this function records every instance of a card via value and returns a map: {"card_value": instance_int, ...}
    var instances = {};
    for (item of vl) {
      if (!instances.hasKey(item)) {instances[item]=1;continue}
      instances[item]+=1
    }
    return instances
  }

  var Flush = function () {
     suits=["s", "d", "c", "h"];found=false
     for (var i=0; i <= 3; i++) {
       if (sl.join("").has(suits[i].repeat(5))) {found=true}
     }
     return found
  }

  var RoyalFlush = function (onlyStraight=false) {
    var values=[1, 10, 11, 12, 13] // ace, 10, jack, queen, king
    var count=0
    for (var i=0; i <= 4; i++) {
      if (vl.has(values[i])) {count+=1}
    }
    if (count < 5) {return false}
    if (onlyStraight) {return true}
    if (!Flush()) {return false}
    return true
  }

  var Straight = function (nonRoyal=false) {
    var found = true
    for (var i=0; i <= 3; i++) {
      if ( !( (vl[i])+1 == vl[i+1] ) ) {found=false;break}
    }
    if (found) {return true}
    var rev=vl.reverse(); found = true

    for (var i=0; i <= 3; i++) {
      if ( !(rev[i]-1 == rev[i+1] ) ) {found=false;break}
    }

    if (!found && (!nonRoyal && RoyalFlush(1))) {return true}
    return found
  }

  var StraightFlush = function () {
    if (Straight(1) && Flush()) {return true}
    return false
  }

  var FourOfAKind = function () {
    if (Flush()) {return false}
    if (Straight()) {return false}
    
    var count=0;
    for (item of Object.values(get_instances(vl))) {
      if (item == 4) {count+=1}
    }

    if (count == 1) {return true}
    return false
  }

  var FullHouse = function () {
    if (Flush()) {return false}
    if (Straight()) {return false}
    if (FourOfAKind()) {return false}

    var count=0; var twos=[]; var threes=[]
    for (item of Object.values(get_instances(vl))) {
      if (item == 2) {twos.push(item)}
      if (item == 3) {threes.push(item)}
    }
    if (twos.length > 0 && threes.length > 0) {return true}
    return false
  }

  var ThreeOfAKind = function () {
    if (Flush()) {return false}
    if (Straight()) {return false}
    if (FullHouse()) {return false}

    var count=0;
    for (item of Object.values(get_instances(vl))) {
      if (item == 3) {count+=1}
    }

    if (count >= 1) {return true}
    return false
  }

  var TwoPair = function () {
    if (Flush()) {return false}
    if (Straight()) {return false}
    if (FourOfAKind()) {return false}
    if (FullHouse()) {return false}

    var count=0;
    for (item of Object.values(get_instances(vl))) {
      if (item == 2) {count+=1}
    }

    if (count >= 2) {return true}
    return false
  }

  var Pair = function () {
    var repeats=[]; var count=1
    if (Flush()) {return false}
    if (Straight()) {return false}
    if (FourOfAKind()) {return false}
    if (FullHouse()) {return false}
    if (ThreeOfAKind()) {return false}
    if (TwoPair()) {return false}

    for (item of vl) {
      if (!repeats.has(item)) {repeats.push(item);continue}
      count+=1
    }
    if (count == 2) {return true}
    return false
  }

  /*
  the following two lines of commented out code allows you to manipulate the combined river (river + hand) to test the result.
  below describes a royal flush of hearts:
  */

  //vl=[1,4,8,10,11,12,13]
  //sl="cdhhhhh".split("")

  if (RoyalFlush()) {return "Royal Flush"}
  if (StraightFlush()) {return "Straight Flush"}
  if (FourOfAKind()) {return "Four of a Kind"}
  if (FullHouse()) {return "Full House"}
  if (Flush()) {return "Flush"}
  if (Straight()) {return "Straight"}
  if (ThreeOfAKind()) {return "Three of a Kind"}
  if (TwoPair()) {return "Two Pair"}
  if (Pair()) {return "Pair"}
  return "High Card"
};

hand_strength=(determine_hand(deck.river, deck.hand.list[0])).color("green")
console.log(hand_strength)
