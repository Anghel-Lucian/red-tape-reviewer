export default class Review {
  constructor(object) {
    this.id = object.id;
    this.rating = object.rating;
    this.title = object.title;
    this.comment = object.comment;
    this.userId = object.userId;
  }
}