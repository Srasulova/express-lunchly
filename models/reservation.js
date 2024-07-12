/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");

/** A reservation for a party */

class Reservation {
  constructor({ id, customerId, numGuests, startAt, notes }) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }

  // getting/ setting number of guests

  set numGuests(val) {
    if (val < 1) throw new Error("Cannot have fewer than 1 person");
    this._numGuests = val;
  }

  get numGuests() {
    return this._numGuests;
  }

  // setting/getting startAt time

  set startAt(val) {
    if (val instanceof Date && !isNaN(val)) this._startAt = val;
    else throw new Error("Not a valid start date");
  }

  get startAt() {
    return this._startAt;
  }

  get formattedStartAt() {
    return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  }

  /** formatter for startAt */

  // getformattedStartAt() {
  //   return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
  // }

  // getting/setting notes(keep as empty string not null)

  set notes(val) {
    this.notes = val || "";
  }

  get notes() {
    return this.notes;
  }

  // setting/ getting customer ID: can be set only once

  set customerId(val) {
    if (this._customerId && this._customerId !== val) {
      throw new Error("Cannot change customer ID");
    } else {
      this._customerId = val;
    }
  }

  get customerId() {
    return this._customerId;
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
      `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
      [customerId]
    );

    return results.rows.map((row) => new Reservation(row));
  }

  // find the reservation by id

  static async get(id) {
    const result = await db.query(
      `select id, customer_id as "customerId", num_guests as "numGuests", start_at as "startAt", notes from reservations where id=$1`,
      [id]
    );
    let reservation = result.rows[0];

    if (reservation === undefined) {
      const error = new Error(`No such reservation: ${id}`);
      error.status = 404;
      throw error;
    }

    return new Reservation(reservation);
  }

  // save the reservation

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `insert into reservations (customer_id, num_guests, start_at, notes) values ($1, $2, $3, $4) returning id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      );

      this.id = result.rows[0].id;
    } else {
      await db.query(
        `update reservations set num_guests=$1, start_at=$2, notes=$3 where id=$4`,
        [this.numGuests, this.startAt, this.notes, this.id]
      );
    }
  }
}

module.exports = Reservation;
