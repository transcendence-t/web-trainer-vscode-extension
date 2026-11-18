function listReadyPickups(parcels) {
  const ready = parcels.filter((parcel) => parcel.ready);
  return ready.map((parcel) => parcel.label);
}
