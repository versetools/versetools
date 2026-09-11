import { readDatacoreRecordByGuid } from "@versetools/sc-data-extractor";

const UNIVERSE_GUID = "d4aff31c-4a4e-432b-adf2-464369a7fa7a";

const universeRecord = readDatacoreRecordByGuid(UNIVERSE_GUID);
console.log(universeRecord);

// const level = readDatacoreRecordByGuid(universeRecord._RecordValue_.level.guid);
// console.log(level);
// console.log(level._RecordValue_.potentialSpawnLocations);

const solarSystems = universeRecord._RecordValue_.SolarSystems;
for (const megaMapSolarSystem of solarSystems) {
	const solarSystem = readDatacoreRecordByGuid(megaMapSolarSystem.Record.guid);
	console.log(solarSystem._RecordValue_.Name);
	// console.log(solarSystem);
	const starmap = readDatacoreRecordByGuid(solarSystem._RecordValue_.SolarSystemRecord.guid);
	console.log(starmap);

	// const systemContainer = readSocpak(megaMapSolarSystem.ObjectContainers[0]);
	// const orbitingContainer = (systemContainer.children as any[]).find(
	// 	(child) => child.class === "OrbitingObjectContainer"
	// );
	// console.log(orbitingContainer);
}
