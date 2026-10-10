import {
  saveProfile,
} from '../lib/profile'

import {
  useRef,
} from 'react'

function Account({
  currentUser,
  currentUserId,
  displayName,
  editableDisplayName,
  setEditableDisplayName,
  setDisplayName,
  memberSince,
  pokemonCount,
  projectCount,
  lastSyncTime,
  pokemonCollection,
  projects,
  playerResources,
  candyFamilyBalances,
  setPokemonCollection,
setProjects,
setPlayerResources,
setCandyFamilyBalances,
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

      const restoreFileInputRef =
  useRef(null)

      function exportBackup() {
  const backup = {
    exportedAt:
      new Date().toISOString(),

    pokemonCollection,

    projects,

    playerResources,

    candyFamilyBalances,
  }


  const blob = new Blob(
    [
      JSON.stringify(
        backup,
        null,
        2
      ),
    ],
    {
      type:
        'application/json',
    }
  )

  const url =
    URL.createObjectURL(
      blob
    )

  const link =
    document.createElement(
      'a'
    )

  link.href = url

  link.download =
    'pokeiq-backup.json'

  link.click()

  URL.revokeObjectURL(
    url
  )
}


  function restoreBackup(

    
  event
) {
  const file =
    event.target.files?.[0]

  if (!file) {
    return
  }

  const reader =
    new FileReader()

  reader.onload = (
    loadEvent
  ) => {
    try {
      const backup =
        JSON.parse(
          loadEvent.target.result
        )

      if (
        !window.confirm(
          'This will replace your current collection, projects, resources, and candy balances. Continue?'
        )
      ) {
        return
      }

      setPokemonCollection(
        backup.pokemonCollection ??
          []
      )

      setProjects(
        backup.projects ??
          []
      )

      setPlayerResources(
        backup.playerResources ??
          {}
      )

      setCandyFamilyBalances(
        backup.candyFamilyBalances ??
          {}
      )

      alert(
        'Backup restored successfully.'
      )
    } catch {
      alert(
        'Invalid backup file.'
      )
    }
  }

  reader.readAsText(
    file
  )
}

const actionButtonStyle = {
  marginTop: '20px',
  marginRight: '10px',
  padding: '12px 24px',
  borderRadius: '8px',
  cursor: 'pointer',
  backgroundColor: '#2a3347',
  color: 'white',
  border: '1px solid #3b4b6b',
}

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

<p
  style={{
    color: '#718096',
    fontSize: '14px',
    marginTop: '4px',
  }}
>
  PokeIQ Closed Beta v0.9.1
</p>

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

        <p>
          {lastSyncTime
            ? new Date(lastSyncTime).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : 'Not synced yet'}
        </p>

        <hr />

<h3>
  Closed Beta Notes
</h3>

<p>
  • Features may change during testing.
</p>

<p>
  • Export backups are recommended.
</p>

<p>
  • Please report any bugs or strange behavior.
</p>

        <h3>Member Since</h3>

<p>
  {
  memberSince
    ? `Trainer since ${new Date(
        memberSince
      ).toLocaleDateString(
        undefined,
        {
          year: 'numeric',
          month: 'long',
        }
      )}`
    : 'Unknown'
}
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
  onClick={exportBackup}
  style={actionButtonStyle}
>
  Export Backup
</button>

<button
  onClick={() =>
    restoreFileInputRef.current?.click()
  }
  style={actionButtonStyle}
>
  Restore Backup
</button>

<input
  ref={restoreFileInputRef}
  type="file"
  accept=".json"
  onChange={restoreBackup}
  style={{
    display: 'none',
  }}
/>

<button
  onClick={() =>
    window.location.href =
      'mailto:carterchapmanepicgames@yahoo.com?subject=PokeIQ Beta Feedback'
  }
  style={actionButtonStyle}
>
  Send Feedback
</button>

<button
  onClick={onLogout}
  style={actionButtonStyle}
>
  Sign Out
</button>
      </div>
    </div>
  )
}

export default Account