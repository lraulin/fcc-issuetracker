"use strict";

require("dotenv").config();

const expect = require("chai").expect;

const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");

const CONNECTION_STRING = process.env.MONGO_URI; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

// Connect to the correct environment database
mongoose.connect(CONNECTION_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Database connected");
});

const issueSchema = new mongoose.Schema({
  project: String,
  issue_title: String,
  issue_text: String,
  created_by: String,
  assigned_to: String,
  status_text: String,
  created_on: Date,
  updated_on: Date,
  open: Boolean,
});

const Issue = mongoose.model("Issue", issueSchema);

const genericErrorMessage = "Something went wrong...";

module.exports = (app) => {
  app
    .route("/api/issues/:project")

    .get(async (req, res) => {
      try {
        const {
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text,
          created_on,
          updated_on,
          open,
        } = req.query;
        const searchCriteria = { project: req.params.project };
        if (issue_title !== undefined) searchCriteria.issue_title = issue_title;
        if (issue_text !== undefined) searchCriteria.issue_text = issue_text;
        if (created_by !== undefined) searchCriteria.created_by = created_by;
        if (assigned_to !== undefined) searchCriteria.assigned_to = assigned_to;
        if (status_text !== undefined) searchCriteria.status_text = status_text;
        if (created_on !== undefined) searchCriteria.created_on = created_on;
        if (updated_on !== undefined) searchCriteria.updated_on = updated_on;
        if (open !== undefined) searchCriteria.open = open;

        const issues = await Issue.find(searchCriteria)
          .select("-project")
          .exec();
        res.status(StatusCodes.OK).send(issues);
      } catch (error) {
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(genericErrorMessage);
      }
    })

    .post(async (req, res) => {
      const { project } = req.params;
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to = "",
        status_text = "",
      } = req.body;
      if (!issue_title || !issue_text || !created_by)
        return res
          .status(StatusCodes.BAD_REQUEST)
          .send("issue_title, issue_text and created_by are required.");
      try {
        const created = await Issue.create({
          project,
          issue_title,
          issue_text,
          created_by,
          assigned_to,
          status_text,
          created_on: new Date(),
          updated_on: null,
          open: true,
        });
        created.project = undefined;
        created.__v = undefined;
        res.status(StatusCodes.CREATED).json(created);
      } catch (error) {
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(genericErrorMessage);
      }
    })

    .put(async (req, res) => {
      const { project } = req.params;
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open,
      } = req.body;

      // If nothing but id is supplied, there is nothing to do.
      if (
        !issue_title &&
        !issue_text &&
        !created_by &&
        !assigned_to &&
        !status_text &&
        !open
      ) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .send("no updated field sent");
      }
      const failMessage = "could not update " + _id;

      try {
        // Get document to update.
        const issue = await Issue.findById(_id);
        if (!issue) return res.status(StatusCodes.NOT_FOUND).send(failMessage);

        if (issue_title) issue.issue_title = issue_title;
        if (issue_text) issue.issue_text = issue_text;
        if (created_by) issue.created_by = created_by;
        if (assigned_to) issue.assigned_to = assigned_to;
        if (status_text) issue.status_text = status_text;
        if (open) issue.open = open;
        issue.updated_on = new Date();

        await issue.save();
        res.status(StatusCodes.OK).send("successfully updated " + _id);
      } catch (error) {
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(failMessage);
      }
    })

    .delete(async (req, res) => {
      const { _id } = req.body;
      if (!_id) return res.status(StatusCodes.BAD_REQUEST).send("_id error");

      try {
        await Issue.findByIdAndDelete(_id);
        res.status(StatusCodes.OK).send("deleted " + _id);
      } catch (error) {
        console.log(error);
        res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .send("could not delete " + _id);
      }
    });
};
