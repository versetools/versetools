import { vEnum } from "@versetools/core/helpers";
import * as z from "zod/v4";

export enum LocationAmenity {
	SpecialEvent = "special_event",
	Docking = "docking",
	Garage = "garage",
	Hospital = "hospital",
	Clinic = "clinic",
	Refinery = "refinery",
	BuyWeapons = "buy_weapons",
	BuyShipItemsAndWeapons = "buy_ship_items_and_weapons",
	BuyArmor = "buy_armor",
	BuyClothing = "buy_clothing",
	BuyVehicles = "buy_vehicles",
	RentVehicles = "rent_vehicles",
	BuyAndRentVehicles = "buy_and_rent_vehicles",
	FoodCourt = "food_court",
	HangarS = "hangar_s",
	HangarM = "hangar_m",
	HangarL = "hangar_l",
	HangarXl = "hangar_xl",
	LandingPadS = "landing_pad_s",
	LandingPadM = "landing_pad_m",
	LandingPadL = "landing_pad_l",
	LandingPadXl = "landing_pad_xl",
	VehicleServices = "vehicle_services",
	CargoFreightElevator = "cargo_freight_elevator",
	CargoLoadingDock = "cargo_loading_dock",
	ExternalFreightElevator = "external_freight_elevator"
}

export const LocationAmenitySchema = z.enum(LocationAmenity);
export const vLocationAmenity = vEnum(LocationAmenity);

export const LocationAmenityNames = {
	[LocationAmenity.SpecialEvent]: "Special Event",
	[LocationAmenity.Docking]: "Docking",
	[LocationAmenity.Garage]: "Garage",
	[LocationAmenity.Hospital]: "Hospital",
	[LocationAmenity.Clinic]: "Clinic",
	[LocationAmenity.Refinery]: "Refinery",
	[LocationAmenity.BuyWeapons]: "Weapons",
	[LocationAmenity.BuyShipItemsAndWeapons]: "Ship Items and Weapons",
	[LocationAmenity.BuyArmor]: "Armor",
	[LocationAmenity.BuyClothing]: "Clothing",
	[LocationAmenity.BuyVehicles]: "Vehicle Sales",
	[LocationAmenity.RentVehicles]: "Vehicle Rentals",
	[LocationAmenity.BuyAndRentVehicles]: "Vehicle Sales and Rentals",
	[LocationAmenity.FoodCourt]: "Food Court",
	[LocationAmenity.HangarS]: "Small Hangar",
	[LocationAmenity.HangarM]: "Medium Hangar",
	[LocationAmenity.HangarL]: "Large Hangar",
	[LocationAmenity.HangarXl]: "Extra Large Hangar",
	[LocationAmenity.LandingPadS]: "Small Landing Pad",
	[LocationAmenity.LandingPadM]: "Medium Landing Pad",
	[LocationAmenity.LandingPadL]: "Large Landing Pad",
	[LocationAmenity.LandingPadXl]: "Extra Large Landing Pad",
	[LocationAmenity.VehicleServices]: "Vehicle Services",
	[LocationAmenity.CargoFreightElevator]: "Cargo Freight Elevator",
	[LocationAmenity.CargoLoadingDock]: "Cargo Loading Dock",
	[LocationAmenity.ExternalFreightElevator]: "External Freight Elevator"
} satisfies Record<LocationAmenity, string>;
