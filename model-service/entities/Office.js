export default class Office {
  constructor(object) {
    this.id = object.id;
    this.averageRating = object.averageRating;
    this.reviews = object.reviews;
    this.name = object.name;
    this.location = object.location;
    this.contact = object.contact;
    this.type = object.type;
    this.services = object.services;
    this.timetable = object.timetable;
  }

}