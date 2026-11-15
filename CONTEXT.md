# Quiz Library

A private, Google-authenticated web app for importing multiple-choice quizzes from CSV, organising them into subjects, and practising them one question at a time.

## Language

**Library**:
The top-level container owned by one user. Holds any number of Subjects.
_Avoid_: Workspace, Collection, Course, Folder

**Subject**:
A named set of Questions inside a Library, created by importing a CSV or manually.
_Avoid_: Quiz, Deck, Set, Course

**Question**:
A single multiple-choice item belonging to a Subject, with two to four Answers and one or more correct Answers.
_Avoid_: Card, Item

**Quiz Session**:
One playthrough of a Subject's Questions by a signed-in user.
_Avoid_: Game, Attempt, Run, Round

**Import**:
The act of turning one CSV file into a new Subject inside a Library.
_Avoid_: Upload, Ingest, Sync
