export default class User {
  constructor(object) {
    this.id = object.id;
    this.email = object.email;
    this.password = object.password;
    this.reviews = object.reviews;
    this.username = object.username;
  }
}