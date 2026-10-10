import {
  saveProfile,
} from '../lib/profile'

function Account({
  currentUser,
  currentUserId,
  displayName,
  editableDisplayName,
  setEditableDisplayName,
  setDisplayName,
  pokemonCount,
  projectCount,
  onLogout,
}) {
  if (!currentUser) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px',
        }}
      >
        <h1>Account</h1>

        <p>
          Please log in to view your
          account.
        </p>
      </div>
    )
  }

  const avatarLetter =
    displayName
      ?.charAt(0)
      ?.toUpperCase() || 'T'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '700px',
          padding: '40px',
          borderRadius: '16px',
          backgroundColor: '#101827',
          border: '1px solid #2a3347',
          textAlign: 'center',
        }}
      >
        <div
  style={{
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#6d4aff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
    margin: '0 auto 20px',
  }}
>
  {avatarLetter}
</div>

<h1>{displayName}</h1>

        <p
          style={{
            color: '#a0aec0',
            marginTop: 0,
            marginBottom: '30px',
          }}
        >
          Trainer Account
        </p>

        <h3>Display Name</h3>

        <input
  type="text"
  value={editableDisplayName}
  onChange={event =>
    setEditableDisplayName(
      event.target.value
    )
  }
  style={{
    width: '250px',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '10px',
  }}
/>

<br />

<button
  onClick={async () => {
    await saveProfile(
      currentUserId,
      editableDisplayName
    )

    setDisplayName(
      editableDisplayName
    )

    alert(
      'Display name updated'
    )
  }}
  style={{
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '10px',
  }}
>
  Save Display Name
</button>


        <hr />

        <h3>Email</h3>

        <p>{currentUser?.email}</p>

        <hr />

        <h3>☁️ Cloud Sync Active</h3>

        <p>
          Your collection is being
          automatically backed up to
          the cloud.
        </p>

        <hr />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            margin: '30px 0',
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
              }}
            >
              {pokemonCount}
            </h2>

            <p>Pokémon</p>
          </div>

          <div>
            <h2
              style={{
                margin: 0,
              }}
            >
              {projectCount}
            </h2>

            <p>Projects</p>
          </div>
        </div>

        <hr />

        <button
          onClick={onLogout}
          style={{
            marginTop: '20px',
            padding:
              '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default Account