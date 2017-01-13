sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"CRUDV1/util/Formatter"
], function(Controller, Formatter) {
	"use strict";

	return Controller.extend("CRUDV1.controller.App", {
		formatter: Formatter,
		onInit: function(){

			//this.buildTable();
			this.buildTable2();
			//this.buildTable3();
		},
		
		//build the table via controller accessing the odataModel in manifest
		buildTable: function(){
			var oTable = sap.ui.getCore().byId(this.createId("table"));
			
			var oItemTemplate = new sap.m.ColumnListItem("listItem",{
                cells : [ 
                	new sap.m.Text({text : "{odataModel>ID}"}),
                    new sap.m.Text({text : "{odataModel>Name}"}),
                    new sap.m.Text({text : "{odataModel>Description}"}),
                    new sap.m.RatingIndicator({value : "{odataModel>Rating}"}),
                    new sap.m.Text({text : "{odataModel>Price}"})
                    ]
			});
			oTable.bindItems("odataModel>/Products", oItemTemplate);
		},
		
		//build the table via controller accessing the odata model binding to the component
		buildTable2: function(){

			var newModel = this.getOwnerComponent().getModel("odataModel");
			var oTable = sap.ui.getCore().byId(this.createId("table"));

			var oItemTemplate = new sap.m.ColumnListItem("listItem",{
                cells : [ 
                	new sap.m.Text({text : "{ID}"}),
                    new sap.m.Text({text : "{Name}"}),
                    new sap.m.Text({text : "{Description}"}),
                    new sap.m.RatingIndicator({value : "{Rating}"}),
                    new sap.m.Text().bindProperty("text", {
                    	parts: [{path : "Price"}],
	                   	formatter: function(value){
                    			return parseInt(value).toFixed(0);
                    	}
                    	//formatter:"CRUDV1.Formatter.currencyValue"
                    	})
                    ]
			});
			oTable.setModel(newModel);
			oTable.bindItems("/Products", oItemTemplate);
			
		},
		
		//converting odata model to json first
		buildTable3: function(){

			var newModel = this.getOwnerComponent().getModel("odataModel");
			//console.log(newModel);
			var oModelJson = new sap.ui.model.json.JSONModel();
			newModel.read("/Products?",{
				success: function(oData, response) {
					//console.log(oData);
					oModelJson.setData(oData);
					//console.log(oModelJson.getData());
				},
				error: function(oError) {
					console.log(oError);
				 }
			});

			var oTable = sap.ui.getCore().byId(this.createId("table"));

			var oItemTemplate = new sap.m.ColumnListItem("listItem",{
                cells : [ 
                	new sap.m.Text({text : "{ID}"}),
                    new sap.m.Text({text : "{Name}"}),
                    new sap.m.Text({text : "{Description}"}),
                    new sap.m.RatingIndicator({value : "{Rating}"}),
                    new sap.m.Text({text : "{Price}"})
                    ]
			});
			oTable.setModel(oModelJson);
			oTable.bindItems("/results", oItemTemplate);
			//oTable.bindAggregation("items", "/results", oItemTemplate); //can also call via this syntax
		},
		
		//function for assigning the prodID for creation
		createFunction: function(){
			sap.ui.getCore().byId(this.createId("table")).getModel().read("/Products", {
				urlParameters : {
					"$top" : 1,
					"$orderby" : "ID desc",
					"$select" : "ID"
				},
				success : jQuery.proxy(function(oData) {
					//call save functionality
					this.createSaveFunction(oData.results[0].ID + 1);
				}, this),
				error : jQuery.proxy(function() {
					console.log("error createFunction");
					//this.oBusyDialog.close();
					//this.showErrorAlert("Cannot determine next ID for new product");
				}, this)
			});
		},
		
		createSaveFunction: function(prodid){
			var oModel = this.getOwnerComponent().getModel("odataModel");
			//var tableModel = sap.ui.getCore().byId(this.createId("table")).getModel();
			
			var oCreateDialog = new sap.m.Dialog();
			oCreateDialog.setTitle("Create New Product");
			
			//create a simple form
			var oSimpleForm = new sap.ui.layout.form.SimpleForm({
				maxContainerCols: 2,
				content:[
					new sap.m.Label({text:"Product ID"}),
					new sap.m.Input({value: prodid,
									 editabled : false}),
					new sap.m.Label({text:"Product Name"}),
					new sap.m.Input({value:""}),
					new sap.m.Label({text:"Product Description"}),
					new sap.m.Input({value:""}),
					new sap.m.Label({text:"Rating"}),
					new sap.m.RatingIndicator({value: 0}),
					new sap.m.Label({text:"Price"}),
					new sap.m.Input({value:""})
					]
			});	
			
			oCreateDialog.addContent(oSimpleForm);
			oCreateDialog.addButton(
					new sap.m.Button({
						text: "Save", 
						icon : "sap-icon://save",
						press: function() {
							var that = this;
							var content = oSimpleForm.getContent();
							// Basic payload data
							var mPayload = {
								ID: parseInt(prodid),
								Name: content[3].getValue(),
								Description: content[5].getValue(),
								ReleaseDate: "1982-12-31T00:00:00",
								Price: (content[9].getValue()).toString(),
								Rating: content[7].getValue()
							};
							// Send OData Create request

							oModel.create("/Products", mPayload, {
								success : jQuery.proxy(function(mResponse) {
									sap.m.MessageToast.show("Product added");
									oCreateDialog.close();
								}, this),
								error : jQuery.proxy(function() {
									sap.m.MessageToast.show("Problem creating new product");
									oCreateDialog.close();
								}, this)
							});

							

						 
							
						}
					})
				);
				
			oCreateDialog.addButton(
						new sap.m.Button({
							text: "Close", 
							press: function(){
									oCreateDialog.close();
							}
						})
			);
			
			oCreateDialog.open();
		},
		
		editFunctionDialog: function(){
			if (!this.oAlertDialog) {
			this.oAlertDialog = sap.ui.xmlfragment("CRUDV1.view.EditDialog", this);
			this.getView().addDependent(this.oAlertDialog);
			}
			this.oAlertDialog.open();
			this.initEditData();
		
		},
		
		initEditData: function(){
			//console.log(sap.ui.getCore().byId(this.createId("table")));
			//console.log(sap.ui.getCore().byId("editProdID"));
			var aContexts = sap.ui.getCore().byId(this.createId("table")).getSelectedContexts();
			console.log(aContexts);
			
			var prodID;
			var name;
			var desc;
			var rating;
			var price;
			
			if (aContexts.length) {
					prodID = aContexts.map(function(oContext) { return oContext.getObject().ID; });
					name = aContexts.map(function(oContext) { return oContext.getObject().Name; });
					desc = aContexts.map(function(oContext) { return oContext.getObject().Description; });
					rating = aContexts.map(function(oContext) { return oContext.getObject().Rating; });
					price = aContexts.map(function(oContext) { return oContext.getObject().Price; });
			}
			
			sap.ui.getCore().byId("editProdID").setValue(prodID);
			sap.ui.getCore().byId("editProdName").setValue(name);
			sap.ui.getCore().byId("editProdDesc").setValue(desc);
			sap.ui.getCore().byId("editProdRating").setValue(parseInt(rating));
			sap.ui.getCore().byId("editProdPrice").setValue(parseInt(price));
			
		},
		
		
		editFunction: function(){
			var oModel = this.getOwnerComponent().getModel("odataModel");
			
			var oEditDialog = new sap.m.Dialog();
			oEditDialog.setTitle("Edit Product");
			
			var oTableCount = sap.ui.getCore().byId(this.createId("table")).getBinding("items").getLength(); 
			
			//get data
			
			var aContexts = sap.ui.getCore().byId(this.createId("table")).getSelectedContexts();
			//console.log(aContexts);
			
			var prodID;
			var name;
			var desc;
			var rating;
			var price;
			
			if (aContexts.length) {
					prodID = aContexts.map(function(oContext) { return oContext.getObject().ID; });
					name = aContexts.map(function(oContext) { return oContext.getObject().Name; });
					desc = aContexts.map(function(oContext) { return oContext.getObject().Description; });
					rating = aContexts.map(function(oContext) { return oContext.getObject().Rating; });
					price = aContexts.map(function(oContext) { return oContext.getObject().Price; });
			}
			
			var oSimpleFormEdit = new sap.ui.layout.form.SimpleForm({
				maxContainerCols: 2,
				content:[
					new sap.m.Label({text:"Product ID"}),
					new sap.m.Input({value: prodID, enabled: false}),
					new sap.m.Label({text:"Product Name"}),
					new sap.m.Input({value: name}),
					new sap.m.Label({text:"Product Description"}),
					new sap.m.Input({value: desc}),
					new sap.m.Label({text:"Rating"}),
					new sap.m.RatingIndicator({value: parseInt(rating)}),
					new sap.m.Label({text:"Price"}),
					new sap.m.Input({value: parseInt(price)})
					]
			});	
			
			oEditDialog.addContent(oSimpleFormEdit);
			oEditDialog.addButton(
					new sap.m.Button({
						text: "Edit", 
						icon : "sap-icon://edit",
						press: function() {

							var content = oSimpleFormEdit.getContent();
							// Basic payload data
							var mPayload = {
								ID: content[1].getValue(),
								Name: content[3].getValue(),
								Description: content[5].getValue(),
								ReleaseDate: "1982-12-31T00:00:00",
								Price: (content[9].getValue()).toString(),
								Rating: content[7].getValue()
							};
							// Send OData Create request
							oModel.update("/Products(" + prodID + ")", mPayload, {
								success : jQuery.proxy(function(mResponse) {
									sap.m.MessageToast.show("Product editted");
									oEditDialog.close();
								}, this),
								error : jQuery.proxy(function() {
									sap.m.MessageToast.show("Problem editting product");
									oEditDialog.close();
								}, this)
							});

							

						 
							
						}
					})
				);
				
			oEditDialog.addButton(
						new sap.m.Button({
							text: "Close", 
							press: function(){
									oEditDialog.close();
							}
						})
			);
				
			oEditDialog.open();
		},
		
		editFunction2: function(oDataEdit){
			var oModel = this.getOwnerComponent().getModel("odataModel");
			var prodID = sap.ui.getCore().byId("editProdID").getValue();
			sap.ui.getCore().byId("editProdName").getValue();
			// Basic payload data
				var mPayload = {
					ID: sap.ui.getCore().byId("editProdID").getValue(),
					Name: sap.ui.getCore().byId("editProdName").getValue(),
					Description: sap.ui.getCore().byId("editProdDesc").getValue(),
					ReleaseDate: "1982-12-31T00:00:00",
					Price: (sap.ui.getCore().byId("editProdPrice").getValue()).toString(),
					Rating: sap.ui.getCore().byId("editProdRating").getValue()
				};
				// Send OData Create request
				oModel.update("/Products(" + prodID + ")", mPayload, {
					success : jQuery.proxy(function(mResponse) {
						sap.m.MessageToast.show("Product editted");
						this.oAlertDialog.close();
					}, this),
					error : jQuery.proxy(function() {
						sap.m.MessageToast.show("Problem editting product");
						this.oAlertDialog.close();
					}, this)
				});
			
		},
		
		onDialogSave : function(oEvent) {
	        //var oData = oEvent.getSource().getBindingContext().getObject();
		    this.editFunction2();
			this.oAlertDialog.close();
		},
		
		onDialogClose: function(){
			this.oAlertDialog.close();
		},

		deleteFunction: function(){
			var oModel = sap.ui.getCore().byId(this.createId("table")).getModel();
			var aContexts = sap.ui.getCore().byId(this.createId("table")).getSelectedContexts();
			//console.log(aContexts);
			
			var prodID;
			
			if (aContexts.length) {
					prodID = aContexts.map(function(oContext) { return oContext.getObject().ID; });
			}
			
			
			oModel.remove("/Products(" + prodID + ")", null, function() {
					oModel.refresh();
					sap.m.MessageToast.show("Product "+ prodID + " deleted");
				},function(){
					sap.m.MessageToast.show("Deletion failed");
				});
			
		},
		
		

	});
});