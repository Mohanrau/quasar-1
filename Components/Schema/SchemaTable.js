// settings
import { searchKey } from 'src/settings/schema'
// app
import { POSITIONS, SCOPES } from '../../Agnostic/enum'
// contracts
import Dynamic from './Contracts/Dynamic'
import Table from './Contracts/Table'
// mixins
import SchemaTableSlots from './Table/Mixins/SchemaTableSlots'
// components
import { AppTable } from '../../Components'
import SchemaDebugger from './Debugger/SchemaDebugger'
import SkeletonSchemaTable from './SkeletonSchemaTable'
import SchemaTableWhere from './Table/Where/SchemaTableWhere'

/**
 * @component {SchemaTable}
 */
export default {
  name: 'SchemaTable',
  /**
   */
  mixins: [
    Dynamic, Table, SchemaTableSlots
  ],
  /**
   */
  methods: {
    /**
     * @param {function} h
     * @param {Array} classes
     * @param {boolean} embed
     * @return {VNode}
     */
    renderTable (h, classes = ['SchemaTable'], embed = false) {
      if (this.$scopedSlots['table-body']) {
        // noinspection JSValidateTypes
        return this.$scopedSlots['table-body']({
          fields: this.fields,
          actions: this.actions,
          domain: this.domain,
          scope: this.scope,
          components: this.columns,
          records: this.data,
          buttons: this.buttons
        })
      }

      if (this.scope === SCOPES.SCOPE_TRASH) {
        classes.push('trash')
      }

      const attrs = this.renderTableAttrs()

      const props = this.renderTableProps()

      const on = this.renderTableOn()

      const scopedSlots = this.renderTableSlots(h)

      const data = {
        class: classes,
        props,
        attrs,
        on,
        scopedSlots
      }
      return h(AppTable, data)
    },
    /**
     * @return {*}
     */
    renderTableAttrs () {
      return {
        ...this.bind,
        dense: this.$q.platform.is.desktop,
        data: this.data,
        columns: this.columns,
        visibleColumns: this.visibleColumns,
        loading: this.loading,
        binaryStateSort: true
      }
    },
    /**
     * @return {*}
     */
    renderTableProps () {
      return {
        pagination: this.pagination,
        selected: this.selected,
        selectedRowsLabel: () => {
          return this.selected.length === 0
            ? ''
            : `${this.selected.length} / ${this.data.length}`
        }
      }
    },
    /**
     * @return {*}
     */
    renderTableOn () {
      return {
        'update:pagination': (pagination) => { this.pagination = pagination },
        'update:selected': (selected) => { this.selected = selected },
        request: (parameters) => this.requestState(parameters)
      }
    },
    /**
     * @param {function} h
     */
    renderWhere (h) {
      const attrs = {
        schema: this.schema,
        primaryKey: this.primaryKey,
        displayKey: this.displayKey,
        value: this[searchKey],
        domain: this.domain,
        fields: this.fields,
        actions: this.actions,
        scope: this.scope
      }
      const on = { input: (value) => this.applySearch(value) }
      return h(SchemaTableWhere, {
        attrs,
        on
      })
    },
    /**
     * @param {function} h
     * @return {VNode}
     */
    renderFloatActionButtons (h) {
      return this.renderSchemaButtons(
        h,
        POSITIONS.POSITION_TABLE_FLOAT,
        {
          floating: true,
          record: this.record,
          records: this.selected
        },
        { label: '' },
        'fab-bottom'
      )
    },
    /**
     * @param {function} h
     * @return {VNode|undefined}
     */
    renderTableDebuggers (h) {
      if (!this.debuggers) {
        return
      }

      const debugging = [
        h(SchemaDebugger, { attrs: { label: 'Data', inspect: this.data } }),
        h(SchemaDebugger, { attrs: { label: 'Columns', inspect: this.columns } }),
        h(SchemaDebugger, { attrs: { label: 'Buttons', inspect: this.buttons } })
      ]

      return h('div', debugging)
    },
    /**
     * @param {function} h
     * @return {VNode}
     */
    renderLoading (h) {
      if (this.$scopedSlots['loading']) {
        // noinspection JSValidateTypes
        return this.$scopedSlots['loading']({ scope: this.scope })
      }
      return h(SkeletonSchemaTable)
    }
  },
  /**
   * @param {function} h
   * @return {VNode}
   */
  render (h) {
    if (!this.domain) {
      return this.renderLoading(h)
    }

    const data = {}
    const children = [
      this.renderTable(h),
      this.renderWhere(h),
      this.renderFloatActionButtons(h)
    ]
    if (this.debuggerAllowed) {
      children.push(this.renderTableDebuggers(h))
    }

    return h('div', data, children)
  }
}
