Any account type is backed by a nostr keypair:
- email (ephemeral keypair + email address)
- Github (ephemeral keypair + basic github account info and permissions to read data from API)
- anon (is only ephemeral keypair)
- Login with nostr (not ephemeral keypair, this is the users keypair, we only have access to private key through web extension interface)

Any time a user signs in, we try to pull the acount from the db, and add all of the data we can from the users record into their session. 
If the user does not have an account in the db we create one for them and return it in a signed in state.
If the users does not have an account and they are signing up anon/github/email we must generate an ephemeral keypair for them and save it to the db (otherwise for nostr login user is bringing their keypair in whcih case we only need to save the pubkey)

Here is another consideration, when a user is signing in via nostr, we want to pull their latest kind0 info and treat that as the latest and greatest. If they have a record in the db we want to update it if the name or image has changed. If they do not have a record we create one with their nostr image and username (or first 8 chars of pubkey if there is no name)

Finally. It is possible to link github to an existing account in whcih case the user can sign in with either github or anon and it will pull the correct recrod.