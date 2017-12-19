Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    featuresRecs : null,
    componentCls: 'app',
    launch: function() {
        console.log("Launch is triggred");
        this._loadFeatures();
    },
    _loadFeatures: function() {
        Ext.create("Rally.data.wsapi.Store",{
            model: 'portfolioitem/feature',
            context: this.getContext().getDataContext(),
            autoLoad: true,
            listeners: {
                load: this._onFeaturesLoaded,
                scope: this
            },
            fetch: ['FormattedID','Name', 'Owner','PlannedEndDate'],
        });
        console.log("Load features completed");
    },
    _onFeaturesLoaded: function(store, data, success) {
        if ( success && store.getCount() > 0 ) {
            var features = data.reduce(function(returnObj, input) {
                returnObj.push(input.get("FormattedID"));
                return returnObj;
            }, []);
            console.log("Features loaded",features);
            
            new Ext.data.ArrayStore({
                // store configs
                storeId: 'futureJsonStore',
                autoLoad : true,            
                proxy: {
                    type: 'ajax',
                    extraParams: {
                        features: features.join()
                    },
                    //url: 'http://avate01-5510:9002/casm-ux/resources/features.json',
                    url: 'http://avate01-ews1929:9002/casm-ux/resources/features.json',
                    //url: 'http://avate01-5510:1337/features.json',
                    reader: {
                        type: 'json',
                        root: 'predictions',
                        idProperty: 'FeatureID'
                    }
                },
                fields: [
                    {name: 'FeatureID', type: 'string'},
                    {name: 'PredictedEndDate', type: 'string'}
                ],
                listeners: {
                    load: function(store, predictData, success) {
                        var keys = {} ;
                        console.log("Keys", predictData)
                        if ( success && store.getCount() > 0 ) {
                            keys = predictData.reduce(function(returnObj, input) {
                                console.log(input.get("FeatureID"),input.get("PredictedEndDate"));
                                returnObj[input.get("FeatureID")] = input.get("PredictedEndDate");
                                return returnObj;
                            }, {});                            
                        }
                       
                        var records = _.map(data, function(record) {
                            //Perform custom actions with the data here
                            //Calculations, etc.
                            return Ext.apply({
                                _xfuture: keys[record.get("FormattedID")]
                            }, record.getData());
                        });
                        this.add({
                            xtype: 'rallygrid',
                            showPagingToolbar: false,
                            showRowActionsColumn: false,
                            editable: false,
                            store: Ext.create('Rally.data.custom.Store', {
                                data: records
                            }),
                            columnCfgs: [
                                {
                                    xtype: 'templatecolumn',
                                    text: 'ID',
                                    dataIndex: 'FormattedID',
                                    flex: 1,
                                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                                },
                                {
                                    text: 'Name',
                                    flex: 2,
                                    dataIndex: 'Name'
                                },
                                {
                                    xtype: 'templatecolumn',
                                    text: 'Owner',
                                    dataIndex: 'Owner',
                                    flex: 2,
                                    tpl: Ext.create('Rally.ui.renderer.template.ObjectTemplate',{fieldName:'Owner'})
                                },
                                {
                                    xtype: 'templatecolumn',
                                    text: 'Planned End Date',
                                    dataIndex: 'PlannedEndDate',
                                    flex: 2,
                                    tpl: Ext.create('Rally.ui.renderer.template.DateTemplate')
                                },
                                {
                                    text: 'Projected End Date',
                                    dataIndex: '_xfuture',
                                    flex: 2,
                                    renderer: function(value) {
                                        return Ext.Date.format(Ext.Date.parse(value, "time"),"m/d/Y h:i: A T");
                                    }
                                }
                            ]
                        });
                    },
                    scope: this
                }
            });                        
        } else {
            console.log("No stores");
        }
    }
});