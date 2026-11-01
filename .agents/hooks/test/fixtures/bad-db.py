# Test fixture: a script that deletes database rows. The guard must block running it.
cursor.execute("DELETE FROM users")
