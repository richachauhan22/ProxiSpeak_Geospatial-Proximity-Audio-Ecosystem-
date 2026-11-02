/**
 * Office Persistence Service
 * Interacts with the MongoDB backend to persist office layouts and furniture obstacles (which block sound).
 */

const API_BASE = '/api/offices';

/**
 * Fetches office blueprint layout, boundaries, and sound-blocking obstacles from MongoDB
 */
export async function fetchOfficeLayout(officeId) {
  try {
    const encoded = encodeURIComponent(officeId || 'main-office');
    const response = await fetch(`${API_BASE}/${encoded}/layout`);
    if (!response.ok) {
      throw new Error(`Failed to fetch office layout (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.warn('[officePersistenceService] fetchOfficeLayout error, using fallback:', error.message);
    return null;
  }
}

/**
 * Saves entire office layout and sound-blocking furniture obstacles into MongoDB
 */
export async function saveOfficeLayout(officeId, { name, bounds, layout, furnitureObstacles }) {
  try {
    const encoded = encodeURIComponent(officeId || 'main-office');
    const response = await fetch(`${API_BASE}/${encoded}/layout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, bounds, layout, furnitureObstacles }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save office layout (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error('[officePersistenceService] saveOfficeLayout error:', error.message);
    throw error;
  }
}

/**
 * Fetches furniture obstacles specifically tagged to block sound from MongoDB
 */
export async function fetchSoundBlockingObstacles(officeId) {
  try {
    const encoded = encodeURIComponent(officeId || 'main-office');
    const response = await fetch(`${API_BASE}/${encoded}/obstacles?blocksSound=true`);
    if (!response.ok) {
      throw new Error(`Failed to fetch sound-blocking obstacles (${response.status})`);
    }
    const data = await response.json();
    return data.obstacles || [];
  } catch (error) {
    console.warn('[officePersistenceService] fetchSoundBlockingObstacles error:', error.message);
    return null;
  }
}

/**
 * Saves or updates a single furniture obstacle in MongoDB
 */
export async function saveFurnitureObstacle(officeId, obstacle) {
  try {
    const encoded = encodeURIComponent(officeId || 'main-office');
    const response = await fetch(`${API_BASE}/${encoded}/obstacles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(obstacle),
    });

    if (!response.ok) {
      throw new Error(`Failed to save obstacle (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error('[officePersistenceService] saveFurnitureObstacle error:', error.message);
    throw error;
  }
}

/**
 * Removes a furniture obstacle from MongoDB
 */
export async function deleteFurnitureObstacle(officeId, obstacleId) {
  try {
    const encodedOffice = encodeURIComponent(officeId || 'main-office');
    const encodedObs = encodeURIComponent(obstacleId);
    const response = await fetch(`${API_BASE}/${encodedOffice}/obstacles/${encodedObs}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete obstacle (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error('[officePersistenceService] deleteFurnitureObstacle error:', error.message);
    throw error;
  }
}

/**
 * Resets office layout and furniture obstacles in MongoDB to the default blueprint
 */
export async function resetOfficeLayout(officeId) {
  try {
    const encoded = encodeURIComponent(officeId || 'main-office');
    const response = await fetch(`${API_BASE}/${encoded}/reset`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Failed to reset office layout (${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error('[officePersistenceService] resetOfficeLayout error:', error.message);
    throw error;
  }
}
