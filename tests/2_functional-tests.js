var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var server = require("../server");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  suite("POST /api/issues/{project} => object with issue data", function () {
    test("Every field filled in", function (done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title",
          issue_text: "text",
          created_by: "Functional Test - Every field filled in",
          assigned_to: "Chai and Mocha",
          status_text: "In QA",
        })
        .end(function (err, res) {
          assert.equal(res.status, 201);
          assert.equal(res.body.issue_title, "Title");
          assert.equal(res.body.issue_text, "text");
          assert.equal(
            res.body.created_by,
            "Functional Test - Every field filled in"
          );
          assert.equal(res.body.assigned_to, "Chai and Mocha");
          assert.equal(res.body.status_text, "In QA");
          assert.isDefined(res.body._id);
          assert.isNull(res.body.updated_on);
          assert.isTrue(res.body.open);

          done();
        });
    });

    test("Required fields filled in", function (done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          issue_title: "Title",
          issue_text: "text",
          created_by: "Functional Test - Required fields filled in",
        })
        .end(function (err, res) {
          assert.equal(res.status, 201);
          assert.equal(res.body.issue_title, "Title");
          assert.equal(res.body.issue_text, "text");
          assert.equal(
            res.body.created_by,
            "Functional Test - Required fields filled in"
          );
          assert.equal(res.body.assigned_to, "");
          assert.equal(res.body.status_text, "");
          assert.isDefined(res.body._id);
          assert.isNull(res.body.updated_on);
          assert.isTrue(res.body.open);

          done();
        });
    });

    test("Missing required fields", function (done) {
      chai
        .request(server)
        .post("/api/issues/test")
        .send({
          assigned_to: "Chai and Mocha",
          status_text: "In QA",
        })
        .end(function (err, res) {
          assert.equal(res.status, 400);
          assert.equal(
            res.text,
            "issue_title, issue_text and created_by are required."
          );
          done();
        });
    });
  });

  suite("PUT /api/issues/{project} => text", function () {
    test("No body", function (done) {
      chai
        .request(server)
        .put("/api/issues/test")
        .send()
        .end(function (err, res) {
          assert.equal(res.status, 400);
          assert.equal(res.text, "no updated field sent");
          done();
        });
    });

    test("One field to update", function (done) {
      chai
        .request(server)
        .get("/api/issues/test")
        .end(function (err, res) {
          const { _id } = res.body[0];
          chai
            .request(server)
            .put("/api/issues/test")
            .send({ _id, issue_title: "Updated Title" })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, "successfully updated " + _id);
              done();
            });
        });
    });

    test("Multiple fields to update", function (done) {
      const issue_title = "New Title";
      const issue_text = "New Text";
      const created_by = "New Person";
      const assigned_to = "New Assignee";
      const status_text = "New Status";

      chai
        .request(server)
        .get("/api/issues/test")
        .end(function (err, res) {
          const { _id } = res.body[0];
          chai
            .request(server)
            .put("/api/issues/test")
            .send({
              _id,
              issue_title,
              issue_text,
              created_by,
              assigned_to,
              status_text,
            })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, "successfully updated " + _id);
              done();
            });
        });
    });
  });

  suite(
    "GET /api/issues/{project} => Array of objects with issue data",
    function () {
      test("No filter", function (done) {
        chai
          .request(server)
          .get("/api/issues/test")
          .query({})
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], "issue_title");
            assert.property(res.body[0], "issue_text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "updated_on");
            assert.property(res.body[0], "created_by");
            assert.property(res.body[0], "assigned_to");
            assert.property(res.body[0], "open");
            assert.property(res.body[0], "status_text");
            assert.property(res.body[0], "_id");
            done();
          });
      });

      test("One filter", function (done) {
        chai
          .request(server)
          .get("/api/issues/test")
          .query({ open: true })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], "issue_title");
            assert.property(res.body[0], "issue_text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "updated_on");
            assert.property(res.body[0], "created_by");
            assert.property(res.body[0], "assigned_to");
            assert.property(res.body[0], "open");
            assert.property(res.body[0], "status_text");
            assert.property(res.body[0], "_id");
            assert.isTrue(res.body[0].open);
            done();
          });
      });

      test("Multiple filters (test for multiple fields you know will be in the db for a return)", function (done) {
        chai
          .request(server)
          .get("/api/issues/test")
          .query({ issue_title: "Title", open: true })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], "issue_title");
            assert.property(res.body[0], "issue_text");
            assert.property(res.body[0], "created_on");
            assert.property(res.body[0], "updated_on");
            assert.property(res.body[0], "created_by");
            assert.property(res.body[0], "assigned_to");
            assert.property(res.body[0], "open");
            assert.property(res.body[0], "status_text");
            assert.property(res.body[0], "_id");
            assert.isTrue(res.body[0].open);
            assert.equal(res.body[0].issue_title, "Title");
            done();
          });
      });
    }
  );

  suite("DELETE /api/issues/{project} => text", function () {
    test("No _id", function (done) {
      chai
        .request(server)
        .delete("/api/issues/test")
        .query({})
        .end(function (err, res) {
          assert.equal(res.status, 400);
          assert.equal(res.text, "_id error");
          done();
        });
    });

    test("Valid _id", function (done) {
      chai
        .request(server)
        .get("/api/issues/test")
        .end(function (err, res) {
          const { _id } = res.body[0];
          chai
            .request(server)
            .delete("/api/issues/test")
            .send({ _id })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.equal(res.text, "deleted " + _id);
              done();
            });
        });
    });
  });
});
